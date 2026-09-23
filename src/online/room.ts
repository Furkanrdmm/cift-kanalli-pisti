// Online oda sistemi: oda kurma, katılma, koltuklar, oyun durumunu paylaşma.
//
// Veritabanı yapısı: rooms/{kod}
//   host      : kurucunun kimliği (bilgisayar oyuncularını ve yeni oyunu o yönetir)
//   status    : 'lobby' (bekleme) | 'playing'
//   opts      : { players, teamMode, target }
//   seats/{i} : { uid, name, online } veya { bot: true, name }   (i = oyuncu sırası)
//   match     : { seq, gameNo, game, wins, move }
//               game/wins/move JSON metni olarak tutulur (veritabanı boş dizileri ve null'ları silmesin diye)
//   updatedAt : son kullanılma zamanı (1 günden eski odalar temizlenir)
import {
  type DataSnapshot,
  type DatabaseReference,
  endAt,
  get,
  limitToFirst,
  onDisconnect,
  onValue,
  orderByChild,
  query,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database'
import type { GameState, Move } from '../game/engine'
import { db, ensureAuth } from './firebase'

export interface Seat {
  uid?: string
  name: string
  bot?: boolean
  online?: boolean
}

export interface RoomOpts {
  players: number
  teamMode: boolean
  target: number
}

export interface MatchData {
  seq: number
  gameNo: number
  game: string
  wins: string
  move: string | null
}

export interface Room {
  code: string
  host: string
  status: 'lobby' | 'playing'
  opts: RoomOpts
  seats: Record<string, Seat>
  match?: MatchData
  updatedAt?: number
}

type StoredRoom = Omit<Room, 'code'>

/** Hamle kaydı: kim (oda sırasına göre) hangi hamleyi yaptı */
export interface MoveRecord {
  player: number
  move: Move
}

/** Bu kadar süredir kullanılmayan odalar silinir */
const ROOM_MAX_AGE_MS = 24 * 60 * 60 * 1000

const roomRef = (code: string) => ref(db, `rooms/${code}`)

const randomCode = () => String(Math.floor(1000 + Math.random() * 9000))

export function seatList(room: Room): (Seat | null)[] {
  return Array.from({ length: room.opts.players }, (_, i) => room.seats?.[i] ?? null)
}

export function mySeatIn(room: Room, uid: string): number {
  return seatList(room).findIndex((s) => s?.uid === uid)
}

/**
 * Veritabanı sıralı koltukları dizi olarak döndürebilir (boşlukları undefined olur);
 * geri yazmadan önce düz nesneye çevir, yoksa yazma hata verir.
 */
function seatObject(seats: StoredRoom['seats'] | (Seat | undefined)[] | undefined): Record<string, Seat> {
  const out: Record<string, Seat> = {}
  Object.entries(seats ?? {}).forEach(([k, s]) => {
    if (s) out[k] = s
  })
  return out
}

// ---- Çevrimiçi durumu: bağlantı koparsa koltuk otomatik "çevrimdışı" olur ----
let presence: { off: () => void; ref: DatabaseReference } | null = null

function stopPresence() {
  if (!presence) return
  presence.off()
  void onDisconnect(presence.ref).cancel()
  presence = null
}

function keepPresence(code: string, seat: number) {
  stopPresence()
  const onlineRef = ref(db, `rooms/${code}/seats/${seat}/online`)
  const off = onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return
    void onDisconnect(onlineRef).set(false)
    void set(onlineRef, true)
  })
  presence = { off, ref: onlineRef }
}

/** 1 günden uzun süredir kullanılmayan odaları sil (oda kurulurken arka planda) */
export async function cleanupOldRooms() {
  const old = query(ref(db, 'rooms'), orderByChild('updatedAt'), endAt(Date.now() - ROOM_MAX_AGE_MS), limitToFirst(25))
  const snap = await get(old)
  const jobs: Promise<void>[] = []
  snap.forEach((child) => {
    jobs.push(remove(child.ref))
  })
  await Promise.all(jobs)
}

/** Yeni oda kur, kurucu 1. koltuğa oturur. Oda kodunu döndürür. */
export async function createRoom(opts: RoomOpts, name: string): Promise<string> {
  const uid = await ensureAuth()
  void cleanupOldRooms().catch(() => {}) // temizlik başarısız olsa da oda kurulsun
  for (let tries = 0; tries < 12; tries++) {
    const code = randomCode()
    const room: StoredRoom = { host: uid, status: 'lobby', opts, seats: { 0: { uid, name, online: true } }, updatedAt: Date.now() }
    const res = await runTransaction(roomRef(code), (cur) => (cur === null ? room : undefined))
    if (res.committed) {
      keepPresence(code, 0)
      return code
    }
  }
  throw new Error('Oda kurulamadı, tekrar dene')
}

/** Koda göre odaya katıl, ilk boş koltuğa otur. Oturulan koltuğu döndürür. */
export async function joinRoom(code: string, name: string): Promise<number> {
  const uid = await ensureAuth()
  let seat = -1
  let reason = ''
  const res = await runTransaction(roomRef(code), (cur: StoredRoom | null) => {
    if (cur === null) return cur // yerel önbellek boş olabilir: sunucudaki veriyle tekrar denenir
    const seats = seatObject(cur.seats)
    const already = Object.entries(seats).find(([, s]) => s.uid === uid)
    if (already) {
      seat = Number(already[0])
      seats[seat] = { ...seats[seat], name, online: true }
      return { ...cur, seats, updatedAt: Date.now() }
    }
    if (cur.status !== 'lobby') {
      reason = 'Bu odada oyun başlamış'
      return undefined
    }
    for (let i = 0; i < cur.opts.players; i++) {
      if (!seats[i]) {
        seat = i
        seats[i] = { uid, name, online: true }
        return { ...cur, seats, updatedAt: Date.now() }
      }
    }
    reason = 'Oda dolu'
    return undefined
  })
  if (!res.committed) throw new Error(reason || 'Odaya katılamadın')
  if (!res.snapshot.exists()) throw new Error('Bu kodla bir oda yok')
  keepPresence(code, seat)
  return seat
}

/** Bekleme odasında boş bir koltuğa geç (takım seçmek için) */
export async function moveSeat(code: string, to: number) {
  const uid = await ensureAuth()
  const res = await runTransaction(roomRef(code), (cur: StoredRoom | null) => {
    if (cur === null) return cur
    if (cur.status !== 'lobby') return undefined
    const seats = seatObject(cur.seats)
    if (seats[to]) return undefined // dolu
    const mine = Object.entries(seats).find(([, s]) => s.uid === uid)
    if (!mine) return undefined
    seats[to] = { ...mine[1], online: true }
    delete seats[mine[0]]
    return { ...cur, seats, updatedAt: Date.now() }
  })
  if (!res.committed || !res.snapshot.exists()) throw new Error('Bu koltuk dolu')
  keepPresence(code, to)
}

export function watchRoom(code: string, cb: (room: Room | null) => void): () => void {
  return onValue(roomRef(code), (snap: DataSnapshot) => {
    const v = snap.val()
    cb(v ? { ...v, code } : null)
  })
}

/** Kurucu (4 kişi eşli): boş koltuğa bilgisayar oturt / bilgisayarı kaldır */
export function setBotSeat(code: string, seat: number, on: boolean, name: string) {
  const r = ref(db, `rooms/${code}/seats/${seat}`)
  return on ? set(r, { bot: true, name }) : remove(r)
}

/** Kurucu: maçı başlat (boş koltuklara bilgisayar oturur) */
export function startMatch(code: string, room: Room, game: GameState, wins: number[], botName: (i: number) => string) {
  const patch: Record<string, unknown> = {
    status: 'playing',
    updatedAt: Date.now(),
    match: { seq: 0, gameNo: 1, game: JSON.stringify(game), wins: JSON.stringify(wins), move: null } satisfies MatchData,
  }
  seatList(room).forEach((s, i) => {
    if (!s) patch[`seats/${i}`] = { bot: true, name: botName(i) }
  })
  return update(roomRef(code), patch)
}

/**
 * Yeni oyun durumunu gönder. Sadece sunucudaki sayaç beklenenle aynıysa yazılır,
 * böylece iki kişi aynı anda yazamaz. Başarılıysa true.
 */
export async function pushMatch(code: string, expectedSeq: number, game: GameState, wins: number[], move: MoveRecord | null, newGame = false) {
  const res = await runTransaction(ref(db, `rooms/${code}/match`), (cur: MatchData | null) => {
    if (cur === null) return cur
    if (cur.seq !== expectedSeq) return undefined
    return {
      seq: expectedSeq + 1,
      gameNo: cur.gameNo + (newGame ? 1 : 0),
      game: JSON.stringify(game),
      wins: JSON.stringify(wins),
      move: move ? JSON.stringify(move) : null,
    } satisfies MatchData
  })
  const ok = res.committed && res.snapshot.exists()
  if (ok) void set(ref(db, `rooms/${code}/updatedAt`), Date.now())
  return ok
}

/** Odadan çık: beklemedeyken koltuk boşalır (kurucu çıkarsa oda kapanır), oyundayken çevrimdışı görünür */
export async function leaveRoom(room: Room, uid: string) {
  const seat = mySeatIn(room, uid)
  stopPresence()
  if (seat < 0) return
  if (room.status === 'lobby') {
    if (room.host === uid) await remove(roomRef(room.code))
    else await remove(ref(db, `rooms/${room.code}/seats/${seat}`))
  } else {
    await set(ref(db, `rooms/${room.code}/seats/${seat}/online`), false)
  }
}

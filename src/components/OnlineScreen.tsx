// Arkadaşla online: oda kur / odaya katıl, bekleme odası, sonra oyun
import { useEffect, useMemo, useState } from 'react'
import { newGame, sidesOf } from '../game/engine'
import { updateSettings, useSettings } from '../game/settings'
import { ensureAuth } from '../online/firebase'
import { localToRemoteSeat, toRemote, winsToRemote } from '../online/perspective'
import { type Room, type RoomOpts, createRoom, joinRoom, leaveRoom, moveSeat, pushMatch, seatList, setBotSeat, startMatch, watchRoom } from '../online/room'
import { Game, type OnlineLink } from './Game'

const SITE = 'https://furkanrdmm.github.io/cift-kanalli-pisti/'
const botName = (i: number) => `Bilgisayar ${i}`

interface Props {
  /** Paylaşılan linkten gelen oda kodu (?oda=1234) */
  initialCode?: string
  onExit: () => void
}

export function OnlineScreen({ initialCode, onExit }: Props) {
  const settings = useSettings()
  const [name, setName] = useState(settings.name)
  const [joinCode, setJoinCode] = useState(initialCode ?? '')
  const [opts, setOpts] = useState<RoomOpts>({ players: 2, teamMode: true, target: 3 })
  const [code, setCode] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null | undefined>(undefined) // undefined: yükleniyor, null: oda yok
  const [uid, setUid] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  // Anonim giriş
  useEffect(() => {
    ensureAuth()
      .then(setUid)
      .catch(() => setError('Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.'))
  }, [])

  // Odayı dinle
  useEffect(() => {
    if (!code) return
    return watchRoom(code, setRoom)
  }, [code])

  const cleanName = name.trim()
  const run = async (f: () => Promise<void>) => {
    if (!cleanName) return setError('Önce adını yaz, arkadaşların seni görsün')
    updateSettings({ name: cleanName })
    setError('')
    setWorking(true)
    try {
      await f()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti')
    } finally {
      setWorking(false)
    }
  }

  const leave = async () => {
    if (room && uid) await leaveRoom(room, uid).catch(() => {})
    setCode(null)
    setRoom(undefined)
  }

  // ---- Oyun ----
  const seats = room ? seatList(room) : []
  const mySeat = room && uid ? seats.findIndex((s) => s?.uid === uid) : -1
  const link: OnlineLink | null = useMemo(() => {
    if (!room || !room.match || room.status !== 'playing' || mySeat < 0) return null
    const n = room.opts.players
    const local = (p: number) => seats[localToRemoteSeat(p, mySeat, n)]
    const teams = room.opts.teamMode && n === 4
    return {
      mySeat,
      isHost: room.host === uid,
      names: Array.from({ length: n }, (_, p) => (p === 0 ? 'Sen' : (local(p)?.name ?? '?'))),
      bots: Array.from({ length: n }, (_, p) => !!local(p)?.bot),
      offline: Array.from({ length: n }, (_, p) => !local(p)?.bot && local(p)?.online === false),
      match: room.match,
      push: (expected, next, wins, move, isNewGame) =>
        pushMatch(
          room.code,
          expected,
          toRemote(next, mySeat),
          winsToRemote(wins, mySeat, teams),
          move ? { player: localToRemoteSeat(move.player, mySeat, n), move: move.move } : null,
          isNewGame,
        ),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, uid, mySeat])

  if (link && room) {
    return (
      <Game
        key={room.code}
        target={room.opts.target}
        online={link}
        onExit={async () => {
          await leave()
          onExit()
        }}
      />
    )
  }

  // ---- Bekleme odası ----
  if (code) {
    if (room === undefined) return <Shell title="Oda" onBack={leave} body={<p className="howto-intro">Bağlanıyor…</p>} />
    if (room === null)
      return (
        <Shell
          title="Oda"
          onBack={leave}
          body={
            <>
              <p className="howto-intro">Oda kapandı. Kurucu odadan çıkmış olabilir.</p>
              <button className="btn btn--primary howto-done" onClick={leave}>
                Geri dön
              </button>
            </>
          }
        />
      )

    const isHost = room.host === uid
    const teamRoom = room.opts.players === 4 && room.opts.teamMode
    const humans = seats.filter((s) => s && !s.bot).length
    const shareText = `Çift Kanallı Pişti odama gel! Oda kodu: ${room.code}\n${SITE}?oda=${room.code}`
    const share = async () => {
      try {
        if (navigator.share) await navigator.share({ title: 'Çift Kanallı Pişti', text: shareText })
        else {
          await navigator.clipboard.writeText(shareText)
          setError('Davet kopyalandı, WhatsApp’a yapıştırabilirsin')
        }
      } catch {
        // paylaşım iptal edildi
      }
    }
    const start = () =>
      run(async () => {
        const g = newGame(room.opts.players, 0, room.opts.teamMode)
        await startMatch(room.code, room, g, sidesOf(g).map(() => 0), botName)
      })

    return (
      <Shell
        title="Oda"
        onBack={leave}
        body={
          <>
            <div className="room-code-box">
              <div className="room-code-label">Oda kodu</div>
              <div className="room-code">{room.code}</div>
              <button className="btn btn--primary room-share" onClick={share}>
                Arkadaşlarına gönder
              </button>
            </div>

            <div className="room-mode">
              {room.opts.players} kişi{room.opts.players === 4 ? (room.opts.teamMode ? ' · eşli' : ' · tekli') : ''} · {room.opts.target} oyun alan kazanır
            </div>

            <div className="seat-list">
              {seats.map((s, i) => (
                <div key={i} className={'seat' + (s ? '' : ' seat--empty') + (s?.uid === uid ? ' seat--me' : '')}>
                  <span className="seat-no">{i + 1}</span>
                  <span className="seat-name">
                    {s ? (s.bot ? `🤖 ${s.name}` : s.name) : 'Bekleniyor…'}
                    {s?.uid === room.host && <small className="seat-host"> kurucu</small>}
                    {s?.uid === uid && <small className="seat-host"> (sen)</small>}
                    {!s && room.opts.players > 2 && <small className="seat-empty-note"> gelmezse bilgisayar oturur</small>}
                  </span>
                  {/* Boş koltuğa geçerek takım/sıra seçilir */}
                  {!s && (
                    <button className="chip-btn" disabled={working} onClick={() => run(() => moveSeat(room.code, i))}>
                      Buraya geç
                    </button>
                  )}
                  {/* 4 kişi eşli: kurucu rakip koltuklarına bilgisayar oturtup arkadaşıyla takım olabilsin */}
                  {isHost && teamRoom && !s?.uid && (
                    <button className="chip-btn" onClick={() => setBotSeat(room.code, i, !s, botName(i))}>
                      {s ? 'Kaldır' : '+ Bilgisayar'}
                    </button>
                  )}
                  {room.opts.teamMode && room.opts.players === 4 && <span className="seat-team">{i % 2 === 0 ? 'A takımı' : 'B takımı'}</span>}
                </div>
              ))}
            </div>

            {isHost ? (
              <>
                <button className="btn btn--primary howto-done" disabled={working || humans < 2} onClick={start}>
                  Oyunu Başlat
                </button>
                <p className="room-hint">
                  {humans < 2 ? 'Arkadaşların odaya girince başlatabilirsin.' : 'Boş kalan koltuklara bilgisayar oturur.'}
                </p>
              </>
            ) : (
              <p className="room-hint">Kurucunun oyunu başlatması bekleniyor…</p>
            )}
            {error && <p className="room-error">{error}</p>}
          </>
        }
      />
    )
  }

  // ---- Giriş: oda kur / katıl ----
  return (
    <Shell
      title="Arkadaşla Online"
      onBack={onExit}
      body={
        <>
          <div className="settings-row">
            <span>Adın</span>
            <input className="name-input" maxLength={14} placeholder="Adını yaz" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <section className="online-card">
            <h3>Odaya Katıl</h3>
            <div className="join-row">
              <input
                className="code-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              />
              <button
                className="btn btn--primary"
                disabled={!uid || working || joinCode.length !== 4}
                onClick={() =>
                  run(async () => {
                    await joinRoom(joinCode, cleanName)
                    setCode(joinCode)
                  })
                }
              >
                Katıl
              </button>
            </div>
          </section>

          <section className="online-card">
            <h3>Oda Kur</h3>
            <div className="menu-label">Kaç kişi?</div>
            <div className="segmented">
              {[2, 3, 4].map((n) => (
                <button key={n} className={opts.players === n ? 'active' : ''} onClick={() => setOpts({ ...opts, players: n })}>
                  {n}
                </button>
              ))}
            </div>
            {opts.players === 4 && (
              <div className="segmented segmented--text">
                <button className={opts.teamMode ? 'active' : ''} onClick={() => setOpts({ ...opts, teamMode: true })}>
                  Eşli
                </button>
                <button className={!opts.teamMode ? 'active' : ''} onClick={() => setOpts({ ...opts, teamMode: false })}>
                  Tekli
                </button>
              </div>
            )}
            <div className="menu-label online-gap">Kaç oyun alan kazanır?</div>
            <div className="segmented">
              {[1, 3, 5].map((n) => (
                <button key={n} className={opts.target === n ? 'active' : ''} onClick={() => setOpts({ ...opts, target: n })}>
                  {n}
                </button>
              ))}
            </div>
            <button
              className="btn btn--primary online-create"
              disabled={!uid || working}
              onClick={() =>
                run(async () => {
                  setCode(await createRoom({ ...opts, teamMode: opts.players === 4 && opts.teamMode }, cleanName))
                })
              }
            >
              Oda Kur
            </button>
          </section>

          {!uid && !error && <p className="room-hint">Sunucuya bağlanılıyor…</p>}
          {error && <p className="room-error">{error}</p>}
        </>
      }
    />
  )
}

function Shell({ title, onBack, body }: { title: string; onBack: () => void; body: React.ReactNode }) {
  return (
    <div className="table">
      <div className="howto">
        <header className="topbar">
          <button className="icon-btn" onClick={onBack} aria-label="Geri">
            ←
          </button>
          <h2 className="howto-title">{title}</h2>
          <span style={{ width: 38 }} />
        </header>
        <div className="howto-body online-body">{body}</div>
      </div>
    </div>
  )
}

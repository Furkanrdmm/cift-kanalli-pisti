// Bakış açısı: online oyunda herkes kendini altta (0. oyuncu) görsün diye
// oyun durumu oyuncu sıraları kaydırılarak "yerel" hale getirilir.
//   yerel sıra = (oda sırası - benim koltuğum) mod oyuncu sayısı
// Oyun motoru sıra kaydırmaya göre simetrik olduğu için yerel durumda oynanan hamle aynı sonucu verir.
import type { GameState } from '../game/engine'

const mod = (a: number, n: number) => ((a % n) + n) % n

function rotateArray<T>(arr: T[], k: number): T[] {
  const n = arr.length
  return arr.map((_, i) => arr[mod(i + k, n)])
}

/** Oyuncu sırasını k kadar kaydır: yeni[i] = eski[i + k] */
function shift(s: GameState, k: number): GameState {
  const n = s.playerCount
  const idx = (p: number) => mod(p - k, n)
  return {
    ...s,
    hands: rotateArray(s.hands, k),
    captured: rotateArray(s.captured, k),
    pistiPoints: rotateArray(s.pistiPoints, k),
    pistiCount: rotateArray(s.pistiCount, k),
    turn: idx(s.turn),
    starter: idx(s.starter),
    lastCapturer: s.lastCapturer === null ? null : idx(s.lastCapturer),
    lastEvent: s.lastEvent ? { ...s.lastEvent, player: idx(s.lastEvent.player) } : null,
    teams: s.teams ? s.teams.map((team) => team.map(idx)) : null,
  }
}

/** Oda durumunu → benim bakış açıma */
export const toLocal = (s: GameState, mySeat: number) => shift(s, mySeat)
/** Benim bakış açımdaki durumu → oda durumuna */
export const toRemote = (s: GameState, mySeat: number) => shift(s, -mySeat)

export const localToRemoteSeat = (p: number, mySeat: number, n: number) => mod(p + mySeat, n)
export const remoteToLocalSeat = (p: number, mySeat: number, n: number) => mod(p - mySeat, n)

/**
 * Maç skoru: eşli oyunda takım sırası değişmez; tekli oyunda taraf = oyuncu olduğu için kaydırılır.
 */
export const winsToLocal = (wins: number[], mySeat: number, teams: boolean) => (teams ? wins : rotateArray(wins, mySeat))
export const winsToRemote = (wins: number[], mySeat: number, teams: boolean) => (teams ? wins : rotateArray(wins, -mySeat))

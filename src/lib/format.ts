import type { Fixture, Match, Player, Score } from '../types'

/** "2026-08-16" for the current UTC day. */
export function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** "19:55 UTC" from an ISO timestamp; null when the input is null/invalid. */
export function timeUTC(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return `${date.toISOString().slice(11, 16)} UTC`
}

/**
 * Per-set games as "6-4 3-2" from Score.games ([games_p1, games_p2], each a
 * per-set list). Empty string when no games are recorded (observed live on
 * completed matches).
 */
export function formatSetScores(score: Score | null | undefined, flip = false): string {
  const a = score?.games?.[flip ? 1 : 0] ?? []
  const b = score?.games?.[flip ? 0 : 1] ?? []
  const sets = Math.max(a.length, b.length)
  const parts: string[] = []
  for (let i = 0; i < sets; i++) {
    parts.push(`${a[i] ?? 0}-${b[i] ?? 0}`)
  }
  return parts.join(' ')
}

/** Current in-game points as "30-15" — only when both entries are non-null. */
export function formatPoints(score: Score | null | undefined): string | null {
  const points = score?.points
  if (!points || points.length < 2) return null
  const [a, b] = points
  if (a == null || b == null) return null
  return `${a}-${b}`
}

/** One live-match line for a snapshot capture. */
export function formatLiveLine(match: Match): string {
  const { p1, p2 } = match.players
  const games = formatSetScores(match.score)
  const points = formatPoints(match.score)
  const bits: string[] = [games || 'in progress']
  if (points) bits.push(match.score?.is_tiebreak ? `TB ${points}` : points)
  if (match.score?.server === 1) bits.push(`${surname(p1.name)} serving`)
  else if (match.score?.server === 2) bits.push(`${surname(p2.name)} serving`)
  const where = [match.tournament, match.round].filter(Boolean).join(', ')
  const suffix = match.event_status === 'Interrupted' ? ' — interrupted' : ''
  return `**${p1.name}** vs **${p2.name}** — ${bits.join(', ')} — ${where}${suffix}`
}

/** One fixture line: "14:30 UTC — A vs B — Tournament (QF)". */
export function formatFixtureLine(fixture: Fixture): string {
  const time = timeUTC(fixture.start_time) ?? 'time TBA'
  const players = `${fixture.player1_name ?? 'TBD'} vs ${fixture.player2_name ?? 'TBD'}`
  const where = fixture.tournament ?? 'tournament TBA'
  const round = fixture.round ? ` (${fixture.round})` : ''
  return `${time} — ${players} — ${where}${round}`
}

/**
 * One completed-match line: "**Winner** def. Loser 6-4 6-2 — Tournament, R16 (2026-08-15)".
 * `winner` is 1|2|null per the API (derived from final sets — null means
 * underivable, which is stated, not guessed).
 */
export function formatResultLine(match: Match): string {
  const { p1, p2 } = match.players
  // Winner's perspective, per convention: flip the p1/p2 pairs when p2 won.
  const games = formatSetScores(match.score, match.winner === 2)
  const date = match.score?.timestamp?.slice(0, 10) ?? match.scheduled_time?.slice(0, 10) ?? null
  const where = [match.tournament, match.round].filter(Boolean).join(', ')
  const tail = `${games ? ` ${games}` : ''}${endNote(match)} — ${where}${date ? ` (${date})` : ''}`
  if (match.winner === 1) return `**${p1.name}** def. ${p2.name}${tail}`
  if (match.winner === 2) return `**${p2.name}** def. ${p1.name}${tail}`
  return `${p1.name} vs ${p2.name}${tail}`
}

function endNote(match: Match): string {
  if (match.event_status === 'Retired') return ' (ret.)'
  if (match.event_status === 'Walk Over') return ' (w/o)'
  if (match.event_status === 'Cancelled') return ' (cancelled)'
  return ''
}

/**
 * One player line: "**Carlos Alcaraz** (ESP) — ATP #2, 8600 pts (up)".
 * `tour` is documented as an opaque per-record string, so it is displayed
 * uppercased, never parsed.
 */
export function formatPlayerLine(player: Player): string {
  const country = player.country ? ` (${player.country})` : ''
  const system = player.tour ? player.tour.toUpperCase().replace(/_/g, ' ') : null
  if (player.ranking == null) {
    return `**${player.name}**${country} — no current ranking`
  }
  const points = player.ranking_points != null ? `, ${player.ranking_points} pts` : ''
  const movement = player.ranking_movement && player.ranking_movement !== 'same' ? ` (${player.ranking_movement})` : ''
  return `**${player.name}**${country} — ${system ? `${system} ` : ''}#${player.ranking}${points}${movement}`
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] || name
}

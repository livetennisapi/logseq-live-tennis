import { describe, expect, it } from 'vitest'
import {
  formatFixtureLine,
  formatLiveLine,
  formatPlayerLine,
  formatPoints,
  formatResultLine,
  formatSetScores,
  timeUTC,
  todayUTC,
} from '../src/lib/format'
import type { Fixture, Match, Player } from '../src/types'

function match(overrides: Partial<Match>): Match {
  return {
    id: 1,
    tournament: 'Cincinnati Open',
    tour: 'atp',
    round: 'QF',
    status: 'live',
    players: { p1: { name: 'Carlos Alcaraz' }, p2: { name: 'Jannik Sinner' } },
    score: null,
    ...overrides,
  }
}

describe('todayUTC / timeUTC', () => {
  it('formats the UTC day', () => {
    expect(todayUTC(new Date('2026-08-16T23:59:00Z'))).toBe('2026-08-16')
  })
  it('formats a UTC time and rejects null/invalid input', () => {
    expect(timeUTC('2026-08-16T14:30:00Z')).toBe('14:30 UTC')
    expect(timeUTC(null)).toBeNull()
    expect(timeUTC('not-a-date')).toBeNull()
  })
})

describe('formatSetScores', () => {
  it('zips per-player per-set game lists ([games_p1, games_p2])', () => {
    expect(formatSetScores({ games: [[6, 3], [4, 6]] })).toBe('6-4 3-6')
  })
  it('is empty for a null score or empty games (seen on completed matches)', () => {
    expect(formatSetScores(null)).toBe('')
    expect(formatSetScores({ games: [[], []] })).toBe('')
  })
  it('pads uneven set lists with 0 instead of dropping the set', () => {
    expect(formatSetScores({ games: [[6, 1], [4]] })).toBe('6-4 1-0')
  })
})

describe('formatPoints', () => {
  it('renders live points including AD', () => {
    expect(formatPoints({ points: ['AD', '40'] })).toBe('AD-40')
  })
  it('returns null when either entry is null (documented on completed matches)', () => {
    expect(formatPoints({ points: [null, '15'] })).toBeNull()
    expect(formatPoints({ points: [] })).toBeNull()
    expect(formatPoints(null)).toBeNull()
  })
})

describe('formatLiveLine', () => {
  it('renders games, points and the server', () => {
    const line = formatLiveLine(
      match({
        score: { games: [[6, 3], [4, 2]], points: ['30', '15'], server: 1, is_tiebreak: false },
      }),
    )
    expect(line).toBe(
      '**Carlos Alcaraz** vs **Jannik Sinner** — 6-4 3-2, 30-15, Alcaraz serving — Cincinnati Open, QF',
    )
  })
  it('marks a tiebreak and an interrupted match', () => {
    const line = formatLiveLine(
      match({
        event_status: 'Interrupted',
        score: { games: [[6], [6]], points: ['5', '3'], server: 2, is_tiebreak: true },
      }),
    )
    expect(line).toContain('TB 5-3')
    expect(line).toContain('Sinner serving')
    expect(line).toContain('— interrupted')
  })
  it('degrades to "in progress" with no games recorded', () => {
    expect(formatLiveLine(match({ score: {} }))).toContain('in progress')
  })
})

describe('formatFixtureLine', () => {
  const fixture: Fixture = {
    id: 9,
    event_date: '2026-08-16',
    start_time: '2026-08-16T14:30:00Z',
    player1_name: 'Iga Swiatek',
    player2_name: 'Aryna Sabalenka',
    tournament: 'Cincinnati Open',
    round: 'SF',
  }
  it('renders time, players, tournament and round', () => {
    expect(formatFixtureLine(fixture)).toBe(
      '14:30 UTC — Iga Swiatek vs Aryna Sabalenka — Cincinnati Open (SF)',
    )
  })
  it('handles a date-only fixture (null start_time is a real state)', () => {
    expect(formatFixtureLine({ ...fixture, start_time: null, round: null })).toBe(
      'time TBA — Iga Swiatek vs Aryna Sabalenka — Cincinnati Open',
    )
  })
})

describe('formatResultLine', () => {
  it('renders winner-first with set scores and date', () => {
    const line = formatResultLine(
      match({
        status: 'completed',
        winner: 2,
        score: { games: [[4, 2], [6, 6]], timestamp: '2026-08-15T18:00:00Z' },
      }),
    )
    // Score shown from the winner's perspective (pairs flipped when p2 won).
    expect(line).toBe(
      '**Jannik Sinner** def. Carlos Alcaraz 6-4 6-2 — Cincinnati Open, QF (2026-08-15)',
    )
  })
  it('annotates a retirement', () => {
    const line = formatResultLine(
      match({
        status: 'completed',
        winner: 1,
        event_status: 'Retired',
        score: { games: [[6, 3], [2, 0]] },
      }),
    )
    expect(line).toContain('(ret.)')
    expect(line.startsWith('**Carlos Alcaraz** def. Jannik Sinner')).toBe(true)
  })
  it('never invents a winner when the API says null', () => {
    const line = formatResultLine(match({ status: 'completed', winner: null, score: null }))
    expect(line).toBe('Carlos Alcaraz vs Jannik Sinner — Cincinnati Open, QF')
  })
})

describe('formatPlayerLine', () => {
  it('renders ranking, points and movement', () => {
    const player: Player = {
      name: 'Carlos Alcaraz',
      country: 'ESP',
      tour: 'atp',
      ranking: 2,
      ranking_points: 8600,
      ranking_movement: 'up',
    }
    expect(formatPlayerLine(player)).toBe('**Carlos Alcaraz** (ESP) — ATP #2, 8600 pts (up)')
  })
  it('omits movement when "same" and points when null', () => {
    const player: Player = { name: 'A B', tour: 'wta', ranking: 30, ranking_points: null, ranking_movement: 'same' }
    expect(formatPlayerLine(player)).toBe('**A B** — WTA #30')
  })
  it('states "no current ranking" honestly instead of guessing', () => {
    expect(formatPlayerLine({ name: 'Qualifier X', country: null, ranking: null })).toBe(
      '**Qualifier X** — no current ranking',
    )
  })
})

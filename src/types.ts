/**
 * Shapes returned by the Live Tennis API, field names verbatim from
 * https://docs.livetennisapi.com/openapi.yaml (v1). Only the fields this
 * plugin reads are declared; unknown fields are ignored by design (the API
 * documents additive changes within v1).
 */

export interface Score {
  sets?: number[]
  /** [games_p1, games_p2]; each a per-set list */
  games?: number[][]
  /** In-game points as tennis strings ("0", "15", "40", "AD"); entries can be null. */
  points?: (string | null)[]
  server?: 1 | 2 | null
  is_tiebreak?: boolean
  timestamp?: string | null
}

export interface Player {
  id?: number
  name: string
  /** Opaque per-record tour string (NOT the tour filter vocabulary). */
  tour?: string | null
  country?: string | null
  ranking?: number | null
  ranking_points?: number | null
  ranking_movement?: 'up' | 'down' | 'same' | null
  is_doubles_team?: boolean
}

export interface Match {
  id: number
  tournament: string
  tour: string | null
  surface?: string | null
  round?: string | null
  round_code?: string | null
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  event_status?: 'Retired' | 'Cancelled' | 'Walk Over' | 'Postponed' | 'Interrupted' | null
  is_doubles?: boolean
  scheduled_time?: string | null
  players: { p1: Player; p2: Player }
  score: Score | null
  /** Completed matches only — derived from final sets. 1 | 2 | null. */
  winner?: number | null
  /** Which player retired/conceded the walkover, when derivable. */
  withdrew?: number | null
}

export interface Fixture {
  id: number
  event_date: string | null
  start_time: string | null
  player1_name: string | null
  player2_name: string | null
  tournament: string | null
  round?: string | null
  round_code?: string | null
  surface?: string | null
  tour?: string | null
}

export interface ListMeta {
  limit?: number
  offset?: number
  count?: number
  total?: number | null
  has_more?: boolean
}

export interface ListResponse<T> {
  data: T[]
  meta?: ListMeta
}

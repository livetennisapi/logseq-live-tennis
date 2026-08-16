import { apiGet } from '../api/client'
import { formatResultLine, todayUTC } from '../lib/format'
import { insertCapture, runCapture } from '../lib/insert'
import type { ListResponse, Match } from '../types'

/**
 * /tennis-results — capture recent completed matches (newest first) for the
 * configured tour. Completed-match history is part of the paid History
 * product (BASIC, or any Historical Data plan): on a FREE key the API
 * returns `403 upgrade_required` and the shared error handler shows the
 * honest tier message instead of inserting anything.
 */
export function registerResultsCommand(): void {
  logseq.Editor.registerSlashCommand('tennis-results', () =>
    runCapture(async ({ apiKey, tour }) => {
      const response = await apiGet<ListResponse<Match>>(
        '/history/matches',
        { tour, limit: 15 },
        apiKey,
      )
      const matches = response.data ?? []
      const header = `Tennis results — captured ${todayUTC()}${tour ? ` (${tour})` : ''}`
      if (matches.length === 0) {
        await insertCapture(header, ['No completed matches returned.'])
        return
      }
      await insertCapture(header, matches.map(formatResultLine))
    }),
  )
}

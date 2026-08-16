import { apiGet } from '../api/client'
import { formatLiveLine, timeUTC } from '../lib/format'
import { insertCapture, runCapture } from '../lib/insert'
import type { ListResponse, Match } from '../types'

/**
 * /tennis-live — capture a ONE-SHOT snapshot of matches currently in play.
 * This is a deliberate capture into your notes, timestamped; it does not
 * poll or auto-refresh.
 */
export function registerLiveCommand(): void {
  logseq.Editor.registerSlashCommand('tennis-live', () =>
    runCapture(async ({ apiKey, tour }) => {
      const response = await apiGet<ListResponse<Match>>(
        '/matches',
        { status: 'live', tour, limit: 50 },
        apiKey,
      )
      const matches = response.data ?? []
      const stamp = timeUTC(new Date().toISOString()) ?? ''
      const header = `Live tennis snapshot — ${new Date().toISOString().slice(0, 10)} ${stamp}${tour ? ` (${tour})` : ''}`
      if (matches.length === 0) {
        await insertCapture(header, ['No matches in play right now.'])
        return
      }
      await insertCapture(header, matches.map(formatLiveLine))
    }),
  )
}

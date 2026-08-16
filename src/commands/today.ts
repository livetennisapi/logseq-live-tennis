import { apiGet } from '../api/client'
import { formatFixtureLine, todayUTC } from '../lib/format'
import { insertCapture, runCapture } from '../lib/insert'
import type { Fixture, ListResponse } from '../types'

/** /tennis-today — capture today's fixtures (UTC day) as a bullet list. */
export function registerTodayCommand(): void {
  logseq.Editor.registerSlashCommand('tennis-today', () =>
    runCapture(async ({ apiKey, tour }) => {
      const response = await apiGet<ListResponse<Fixture>>(
        '/fixtures',
        { tour, limit: 100 },
        apiKey,
      )
      const today = todayUTC()
      const todays = (response.data ?? []).filter((f) => f.event_date === today)
      const header = `Tennis fixtures — ${today}${tour ? ` (${tour})` : ''}`
      if (todays.length === 0) {
        await insertCapture(header, ['No fixtures scheduled today.'])
        return
      }
      await insertCapture(header, todays.map(formatFixtureLine))
    }),
  )
}

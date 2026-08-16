import type { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

/** `tour` query filter vocabulary from the OpenAPI spec ('' = all tours). */
export const TOURS = ['all', 'atp', 'wta', 'challenger', 'itf', 'juniors'] as const

export const settingsSchema: SettingSchemaDesc[] = [
  {
    key: 'apiKey',
    type: 'string',
    default: '',
    title: 'Live Tennis API key',
    description:
      'Get a FREE key (no card) at https://livetennisapi.com/subscribe/free. ' +
      'FREE covers live scores, fixtures, players and tournaments at 30 requests/min, 100/day. ' +
      'Completed-match history and H2H are paid tiers. ' +
      "**Stored in plaintext** in Logseq's settings file.",
  },
  {
    key: 'defaultTour',
    type: 'enum',
    enumChoices: [...TOURS],
    enumPicker: 'select',
    default: 'all',
    title: 'Default tour',
    description: 'Tour filter used by /tennis-today, /tennis-results and /tennis-live.',
  },
]

export interface PluginSettings {
  apiKey: string
  /** undefined = all tours (the `tour` param is omitted from requests). */
  tour: string | undefined
}

export function readSettings(raw: Record<string, unknown> | undefined | null): PluginSettings | null {
  const apiKey = typeof raw?.apiKey === 'string' ? raw.apiKey.trim() : ''
  if (!apiKey) return null
  const tourRaw = typeof raw?.defaultTour === 'string' ? raw.defaultTour : 'all'
  const tour = tourRaw === 'all' || tourRaw === '' ? undefined : tourRaw
  return { apiKey, tour }
}

export function getSettings(): PluginSettings | null {
  return readSettings(logseq.settings as Record<string, unknown> | undefined)
}

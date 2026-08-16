import { apiGet } from '../api/client'
import { formatPlayerLine } from '../lib/format'
import { runCapture } from '../lib/insert'
import type { ListResponse, Player } from '../types'

/**
 * /tennis-player — type a player name in the block, run the command, and the
 * block becomes a player line with the current ranking (top search hit;
 * `/players` returns ranked players first).
 */
export function registerPlayerCommand(): void {
  logseq.Editor.registerSlashCommand('tennis-player', () =>
    runCapture(async ({ apiKey }) => {
      const block = await logseq.Editor.getCurrentBlock()
      if (!block) {
        void logseq.UI.showMsg('Run this command inside a block.', 'warning')
        return
      }
      const typed = (await logseq.Editor.getEditingBlockContent()) ?? block.content ?? ''
      const query = typed.replace(/\/tennis-player\s*$/i, '').trim()
      if (!query) {
        void logseq.UI.showMsg('Type a player name in the block first, e.g. "Alcaraz /tennis-player".', 'warning')
        return
      }
      const response = await apiGet<ListResponse<Player>>(
        '/players',
        { search: query, limit: 5 },
        apiKey,
      )
      const players = response.data ?? []
      if (players.length === 0) {
        void logseq.UI.showMsg(`No player found for "${query}".`, 'warning')
        return
      }
      await logseq.Editor.updateBlock(block.uuid, formatPlayerLine(players[0]))
      await logseq.Editor.exitEditingMode()
    }),
  )
}

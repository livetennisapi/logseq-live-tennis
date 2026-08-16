import { friendlyMessage } from '../api/client'
import { getSettings, type PluginSettings } from '../settings'

/**
 * Write a header into the block the slash command ran in and the lines as
 * its children. Uses only `logseq.Editor` block APIs, which work on both
 * file graphs and DB graphs.
 */
export async function insertCapture(header: string, lines: string[]): Promise<void> {
  const block = await logseq.Editor.getCurrentBlock()
  if (!block) {
    void logseq.UI.showMsg('Run this command inside a block.', 'warning')
    return
  }
  await logseq.Editor.updateBlock(block.uuid, header)
  if (lines.length > 0) {
    await logseq.Editor.insertBatchBlock(
      block.uuid,
      lines.map((content) => ({ content })),
      { sibling: false },
    )
  }
  await logseq.Editor.exitEditingMode()
}

/**
 * Shared command wrapper: check settings, run, report errors honestly via
 * `logseq.UI.showMsg` (including the paid-tier message on 403).
 */
export async function runCapture(task: (settings: PluginSettings) => Promise<void>): Promise<void> {
  const settings = getSettings()
  if (!settings) {
    void logseq.UI.showMsg(
      'Tennis Capture: set your Live Tennis API key in the plugin settings first (free key: livetennisapi.com/subscribe/free).',
      'warning',
    )
    return
  }
  try {
    await task(settings)
  } catch (err) {
    console.error('logseq-live-tennis:', err)
    void logseq.UI.showMsg(friendlyMessage(err), 'warning')
  }
}

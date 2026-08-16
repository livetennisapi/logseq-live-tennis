import '@logseq/libs'
import { settingsSchema } from './settings'
import { registerTodayCommand } from './commands/today'
import { registerResultsCommand } from './commands/results'
import { registerPlayerCommand } from './commands/player'
import { registerLiveCommand } from './commands/live'

function main() {
  logseq.useSettingsSchema(settingsSchema)
  registerTodayCommand()
  registerResultsCommand()
  registerPlayerCommand()
  registerLiveCommand()
}

logseq.ready(main).catch(console.error)

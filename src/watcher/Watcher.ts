import { DreamCLI } from '@rvoh/dream'
import * as fs from 'fs'
import psychicPath from '../helpers/path/psychicPath.js'
import PsychicApp from '../psychic-app/index.js'

// should we make this customizable?
const TIMEOUT_INTERVAL = 3_000

export default class Watcher {
  private static syncing: boolean = false

  public static watch(
    // the path to the src folder in your psychic app
    srcDir: string = psychicPath('src'),
  ) {
    let timer: NodeJS.Timeout

    fs.watch(
      srcDir,
      { recursive: true },

      (_, filename) => {
        // do not want to sync if we are already syncing.
        if (this.syncing) return

        if (filename && /\.ts$/.test(filename)) {
          // create a manual debounce pattern by clearing
          // the timeout and restarting it
          clearTimeout(timer)

          const seconds = TIMEOUT_INTERVAL / 1000
          DreamCLI.logger.log(`${filename} changed, douncing sync for ${seconds} seconds...`)

          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          timer = setTimeout(async () => {
            DreamCLI.logger.log(`executing sync...`)

            const psy = PsychicApp.getOrFail()

            this.syncing = true
            await DreamCLI.spawn(psy.psyCmd('sync'))

            // pause for an additional second, so that any file changes
            // still being regestered from the end of the sync
            // command don't accidentally trick it into running again,
            // which could cause an infinite loop of reloading
            setTimeout(() => {
              this.syncing = false
              DreamCLI.logger.log(`resuming watch...`)
            }, 1000)
          }, TIMEOUT_INTERVAL)
        }
      },
    )

    DreamCLI.logger.log(`watching ${srcDir}...`)
  }
}

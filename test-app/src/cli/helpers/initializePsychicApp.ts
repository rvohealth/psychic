import '../../conf/global.js'

import { PsychicApp } from '../../../../src/package-exports/index.js'
import { PsychicAppInitOptions } from '../../../../src/psychic-app/index.js'
import psychicConfCb from '../../conf/app.js'
import dreamCb from '../../conf/dream.js'

Error.stackTraceLimit = 50

export default async function initializePsychicApp(opts: PsychicAppInitOptions = {}) {
  try {
    const psychicApp = await PsychicApp.init(psychicConfCb, dreamCb, opts)
    return psychicApp
  } catch (err) {
    console.error(err)
    throw err
  }
}

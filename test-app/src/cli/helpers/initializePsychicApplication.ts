import '../../conf/global'

import { PsychicApplication } from '../../../../src.js'
import { PsychicApplicationInitOptions } from '../../../../src/psychic-application.js'
import psychicConfCb from '../../conf/app.js'
import dreamCb from '../../conf/dream.js'

Error.stackTraceLimit = 50

export default async function initializePsychicApplication(opts: PsychicApplicationInitOptions = {}) {
  try {
    const psychicApp = await PsychicApplication.init(psychicConfCb, dreamCb, opts)
    return psychicApp
  } catch (err) {
    console.error(err)
    throw err
  }
}

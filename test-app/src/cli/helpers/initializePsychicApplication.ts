import '../../conf/global'

import { PsychicApplication } from '../../../../src'
import psychicConfCb from '../../conf/app'
import dreamCb from '../../conf/dream'
import { PsychicApplicationInitOptions } from '../../../../src/psychic-application'

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

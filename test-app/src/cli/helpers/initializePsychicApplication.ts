import '../../conf/global'

import { PsychicApplication } from '../../../../src'
import psychicConfCb from '../../conf/app'
import dreamCb from '../../conf/dream'
import { PsychicApplicationInitOptions } from '../../../../src/psychic-application'

export default async function initializePsychicApplication(opts: PsychicApplicationInitOptions = {}) {
  return await PsychicApplication.init(psychicConfCb, dreamCb, opts)
}

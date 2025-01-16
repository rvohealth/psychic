import '../../conf/global'

import { PsychicApplication } from '../../../../src'
import psychicConfCb from '../../conf/app'
import dreamCb from '../../conf/dream'

export default async function initializePsychicApplication({
  bypassModelIntegrityCheck = false,
}: { bypassModelIntegrityCheck?: boolean } = {}) {
  return await PsychicApplication.init(psychicConfCb, dreamCb, { bypassModelIntegrityCheck })
}

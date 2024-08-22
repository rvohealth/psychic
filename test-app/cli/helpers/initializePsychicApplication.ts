import { PsychicApplication } from '../../../src'
import psychicConfCb from '../../conf/app'
import dreamCb from '../../conf/dream'

export default async function initializePsychicApplication() {
  return await PsychicApplication.init(psychicConfCb, dreamCb)
}

import { PsychicApplication } from '@rvohealth/psychic'
import psychicCb from '../../conf/app'
import dreamCb from '../../conf/dream'

export default async function initializePsychicApplication() {
  return await PsychicApplication.init(psychicCb, dreamCb)
}

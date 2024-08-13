import { DreamApplication } from '@rvohealth/dream'
import dreamConfCb from '../../conf/dream'

export default async function initializeDreamApplication() {
  return await DreamApplication.init(dreamConfCb)
}

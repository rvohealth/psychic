import { PsychicApplication } from '../../../src'
import psychicConfCb from '../../conf/app'
import initializeDreamApplication from './initializeDreamApplication'

export default async function initializePsychicApplication() {
  await initializeDreamApplication()
  return await PsychicApplication.init(psychicConfCb)
}

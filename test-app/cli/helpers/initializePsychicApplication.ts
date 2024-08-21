import { DreamApplication } from '@rvohealth/dream'
import { PsychicApplication } from '../../../src'
import psychicCb from '../../conf/app'
import dreamCb from '../../conf/dream'

export default async function initializePsychicApplication() {
  let psychicApp: PsychicApplication

  await DreamApplication.init(dreamCb, {}, async dreamApp => {
    psychicApp = await PsychicApplication.init(psychicCb)
    dreamApp.set('projectRoot', psychicApp.apiRoot)
  })

  return psychicApp!
}

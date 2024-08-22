import { DreamBin } from '@rvohealth/dream'
import initializePsychicApplication from './initializePsychicApplication'
import { PsychicApplication, PsychicBin } from '../../../src'

export default async function sync() {
  await initializePsychicApplication()
  await DreamBin.sync()

  const psychicApp = PsychicApplication.getOrFail()

  if (psychicApp && !psychicApp?.apiOnly) {
    await PsychicBin.syncOpenapiJson()
    await PsychicBin.syncOpenapiClientSchema()
  }
}

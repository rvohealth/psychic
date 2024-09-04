import { DreamBin } from '@rvohealth/dream'
import { PsychicApplication, PsychicBin } from '../../../../src'
import initializePsychicApplication from './initializePsychicApplication'

export default async function sync() {
  await initializePsychicApplication()
  await DreamBin.sync()

  const psychicApp = PsychicApplication.getOrFail()

  if (psychicApp && !psychicApp?.apiOnly) {
    await PsychicBin.syncOpenapiJson()
    await PsychicBin.syncOpenapiClientSchema()
  }
}

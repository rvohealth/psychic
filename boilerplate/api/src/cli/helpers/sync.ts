import { DreamBin } from '@rvohealth/dream'
import { PsychicApplication, PsychicBin } from '@rvohealth/psychic'
import initializePsychicApplication from './initializePsychicApplication'

export default async function sync() {
  await initializePsychicApplication()
  await DreamBin.sync()

  const psychicApp = PsychicApplication.getOrFail()

  await PsychicBin.syncOpenapiJson()

  if (psychicApp && !psychicApp?.apiOnly) {
    await PsychicBin.syncOpenapiClientSchema()
  }
}

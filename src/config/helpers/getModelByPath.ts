import { Dream } from 'dream'
import PsychicDir from '../../helpers/psychicdir'

export default async function getModelByPath(modelPath: string) {
  const models = await PsychicDir.models()
  return models[modelPath] as typeof Dream | undefined
}

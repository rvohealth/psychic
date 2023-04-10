import { DreamModel } from 'dream'
import HowlDir from '../../helpers/howldir'

export default async function getModelByPath(modelPath: string) {
  const models = await HowlDir.models()
  return models[modelPath] as DreamModel<any, any> | undefined
}

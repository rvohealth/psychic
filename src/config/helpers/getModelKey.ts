import { DreamModel } from 'dream'
import HowlDir from '../../helpers/howldir'

export default async function getModelKey(ModelClass: DreamModel<any, any>) {
  const models = await HowlDir.models()
  return Object.keys(models).find(key => models[key].toString() === ModelClass.toString())
}

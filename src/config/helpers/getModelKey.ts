import { DreamModel } from 'dream'
import PsychicDir from '../../helpers/howldir'

export default async function getModelKey(ModelClass: DreamModel<any, any>) {
  const models = await PsychicDir.models()
  return Object.keys(models).find(key => models[key].toString() === ModelClass.toString())
}

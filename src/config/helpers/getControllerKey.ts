import PsychicDir from '../../helpers/howldir'
import PsychicController from '../../controller'

export default async function getControllerKey(ControllerClass: typeof PsychicController) {
  const models = await PsychicDir.controllers()
  return Object.keys(models).find(key => models[key].toString() === ControllerClass.toString())
}

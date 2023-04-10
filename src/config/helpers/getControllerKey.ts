import HowlDir from '../../helpers/howldir'
import HowlController from '../../controller'

export default async function getControllerKey(ControllerClass: typeof HowlController) {
  const models = await HowlDir.controllers()
  return Object.keys(models).find(key => models[key].toString() === ControllerClass.toString())
}

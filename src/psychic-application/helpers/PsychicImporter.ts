import { DreamImporter } from '@rvoh/dream'
import PsychicController from '../../controller/index.js.js'

export default class PsychicImporter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async importControllers(controllersPath: string, importCb: (path: string) => Promise<any>) {
    const controllerPaths = await DreamImporter.ls(controllersPath)

    const controllerClasses = (await Promise.all(
      controllerPaths.map(controllerPath =>
        importCb(controllerPath).then(dreamClass => [controllerPath, dreamClass as typeof PsychicController]),
      ),
    )) as [string, typeof PsychicController][]

    return controllerClasses
  }
}

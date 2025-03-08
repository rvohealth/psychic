import { DreamImporter } from '@rvohealth/dream'
import PsychicController from '../../controller'

export default class PsychicImporter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async importControllers(controllersPath: string, importCb: (path: string) => Promise<any>) {
    const controllerPaths = await DreamImporter.ls(controllersPath)

    const controllerClasses: [string, typeof PsychicController][] = []

    for (const controllerPath of controllerPaths) {
      controllerClasses.push([controllerPath, (await importCb(controllerPath)) as typeof PsychicController])
    }

    return controllerClasses
  }
}

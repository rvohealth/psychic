import { DreamImporter } from '@rvoh/dream'
import PsychicController from '../../controller/index.js'

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

  public static async importServices(
    pathToServices: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importCb: (path: string) => Promise<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<[string, any][]> {
    const servicePaths = await DreamImporter.ls(pathToServices)

    const serviceClasses = (await Promise.all(
      servicePaths.map(servicePath =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        importCb(servicePath).then(serviceClass => [servicePath, serviceClass]),
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as [string, any][]

    return serviceClasses
  }
}

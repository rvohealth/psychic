import fs from 'fs/promises'
import path from 'path'
import { BackgroundedService, PsychicApplication } from '../../../../src'

export default class LastDummyServiceInNamedWorkstream extends BackgroundedService {
  public static get backgroundConfig() {
    return { priority: 'last' as const, workstream: 'snazzy' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async classRunInBG(arg: any) {
    const psychicApp = PsychicApplication.getOrFail()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), arg)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructorArg: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(arg: any) {
    super()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.constructorArg = arg
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async instanceRunInBG(arg: any) {
    await this.instanceMethodToTest(this.constructorArg, arg)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async instanceMethodToTest(a: any, b: any) {
    const psychicApp = PsychicApplication.getOrFail()
    await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), `${a},${b}`)
  }
}

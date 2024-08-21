import fs from 'fs/promises'
import path from 'path'
import backgroundedService from '../../../src/background/backgrounded-service'
import { getCachedPsychicApplicationOrFail } from '../../../src/psychic-application/cache'

export default class NotUrgentDummyService extends backgroundedService('not_urgent') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async classRunInBG(arg: any) {
    const psychicApp = getCachedPsychicApplicationOrFail()
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
    const psychicApp = getCachedPsychicApplicationOrFail()
    await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), `${a},${b}`)
  }
}

import { Job } from 'bullmq'
import fs from 'fs/promises'
import path from 'path'
import { BackgroundedService, PsychicApplication } from '../../../../src'

export default class DummyService extends BackgroundedService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async classRunInBG(arg: any) {
    const psychicApp = PsychicApplication.getOrFail()
    await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), `${arg}`)
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
  public async instanceRunInBG(arg: any, job: Job) {
    await this.instanceMethodToTest(this.constructorArg, arg, job)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async instanceMethodToTest(a: any, b: any, job: Job) {
    const psychicApp = PsychicApplication.getOrFail()
    await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), `${a},${b},${job.name}`)
  }

  public static async classRunInBGWithJobArg(arg: 'bottlearum', job: Job) {
    const psychicApp = PsychicApplication.getOrFail()
    await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), `${arg},${job.name}`)
  }
}

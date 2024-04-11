import fs from 'fs/promises'
import backgroundedService from '../../../src/background/backgrounded-service'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'

export default class DummyService extends backgroundedService(__filename) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async classRunInBG(arg: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await fs.writeFile(absoluteFilePath('spec/tmp.txt'), arg)
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
    await fs.writeFile(absoluteFilePath('spec/tmp.txt'), `${a},${b}`)
  }
}

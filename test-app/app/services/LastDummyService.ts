import fs from 'fs/promises'
import backgroundedService from '../../../src/background/backgrounded-service'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'

export default class LastDummyService extends backgroundedService(__filename, 'last') {
  public static async classRunInBG(arg: any) {
    await fs.writeFile(absoluteFilePath('spec/tmp.txt'), arg)
  }

  public constructorArg: any
  constructor(arg: any) {
    super()
    this.constructorArg = arg
  }

  public async instanceRunInBG(arg: any) {
    await this.instanceMethodToTest(this.constructorArg, arg)
  }

  public async instanceMethodToTest(a: any, b: any) {
    await fs.writeFile(absoluteFilePath('spec/tmp.txt'), `${a},${b}`)
  }
}

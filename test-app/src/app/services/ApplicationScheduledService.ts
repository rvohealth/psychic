import BaseScheduledService from '../../../../src/background/BaseScheduledService'
import psychicTypes from '../../types/psychic'

export default class ApplicationScheduledService extends BaseScheduledService {
  public get psychicTypes() {
    return psychicTypes
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static classRunInBg(arg1: any) {
    if (arg1) {
      // noop
    }
  }
}

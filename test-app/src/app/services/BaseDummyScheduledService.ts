import ScheduledService from '../../../../src/background/scheduled-service'

export default class BaseDummyScheduledService extends ScheduledService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static classRunInBg(arg1: any) {
    if (arg1) {
      // noop
    }
  }
}

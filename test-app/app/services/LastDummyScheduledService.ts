import { ScheduledService } from '../../../src'

export default class LastDummyScheduledService extends ScheduledService {
  public static get priority() {
    return 'last' as const
  }
}

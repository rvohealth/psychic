import { ScheduledService } from '../../../src'

export default class UrgentDummyScheduledService extends ScheduledService {
  public static get priority() {
    return 'urgent' as const
  }
}

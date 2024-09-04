import { ScheduledService } from '../../../../src'

export default class NotUrgentDummyScheduledService extends ScheduledService {
  public static get priority() {
    return 'not_urgent' as const
  }
}

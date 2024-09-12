import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class NotUrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get priority() {
    return 'not_urgent' as const
  }
}

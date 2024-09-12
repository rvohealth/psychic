import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class UrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get priority() {
    return 'urgent' as const
  }
}

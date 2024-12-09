import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class UrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundJobConfig() {
    return { priority: 'urgent' as const }
  }
}

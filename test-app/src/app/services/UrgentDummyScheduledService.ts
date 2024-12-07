import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class UrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundConfig() {
    return { priority: 'urgent' as const }
  }
}

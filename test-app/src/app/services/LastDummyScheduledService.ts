import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class LastDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundJobConfig() {
    return { priority: 'last' as const }
  }
}

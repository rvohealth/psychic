import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class LastDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundConfig() {
    return { priority: 'last' as const }
  }
}

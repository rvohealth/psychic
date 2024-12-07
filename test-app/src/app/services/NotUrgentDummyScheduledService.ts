import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class NotUrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundConfig() {
    return { priority: 'not_urgent' as const }
  }
}

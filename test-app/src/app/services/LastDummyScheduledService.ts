import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class LastDummyScheduledService extends BaseDummyScheduledService {
  public static get priority() {
    return 'last' as const
  }
}

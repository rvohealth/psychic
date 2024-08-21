import BaseScheduledService from './base'

export default class ScheduledService extends BaseScheduledService {
  public static get priority() {
    return 'default' as const
  }
}

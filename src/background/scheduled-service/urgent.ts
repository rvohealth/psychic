import BaseScheduledService from './base'

export default class UrgentScheduledService extends BaseScheduledService {
  public static get priority() {
    return 'urgent' as const
  }
}

import BaseScheduledService from './base'

export default class NotUrgentScheduledService extends BaseScheduledService {
  public static get priority() {
    return 'not_urgent' as const
  }
}

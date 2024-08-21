import BaseScheduledService from './base'

export default class LastScheduledService extends BaseScheduledService {
  public static get priority() {
    return 'last' as const
  }
}

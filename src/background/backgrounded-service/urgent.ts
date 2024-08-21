import BaseBackgroundedService from './base'

export default class UrgentBackgroundedService extends BaseBackgroundedService {
  public static get priority() {
    return 'urgent' as const
  }
}

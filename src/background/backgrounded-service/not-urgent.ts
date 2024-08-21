import BaseBackgroundedService from './base'

export default class NotUrgentBackgroundedService extends BaseBackgroundedService {
  public static get priority() {
    return 'not_urgent' as const
  }
}

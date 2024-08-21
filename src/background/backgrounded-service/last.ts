import BaseBackgroundedService from './base'

export default class LastBackgroundedService extends BaseBackgroundedService {
  public static get priority() {
    return 'last' as const
  }
}

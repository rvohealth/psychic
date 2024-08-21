import BaseBackgroundedService from './base'

export default class BackgroundedService extends BaseBackgroundedService {
  public static get priority() {
    return 'default' as const
  }
}

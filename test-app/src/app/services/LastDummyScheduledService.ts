import { BackgroundJobConfig } from '../../../../src'
import ApplicationScheduledService from './ApplicationScheduledService'

export default class LastDummyScheduledService extends ApplicationScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig<ApplicationScheduledService> {
    return { priority: 'last' }
  }
}

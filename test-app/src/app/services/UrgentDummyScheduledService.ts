import { BackgroundJobConfig } from '../../../../src'
import ApplicationScheduledService from './ApplicationScheduledService'

export default class UrgentDummyScheduledService extends ApplicationScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig<ApplicationScheduledService> {
    return { priority: 'urgent' }
  }
}

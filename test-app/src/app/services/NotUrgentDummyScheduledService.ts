import { BackgroundJobConfig } from '../../../../src'
import ApplicationScheduledService from './ApplicationScheduledService'

export default class NotUrgentDummyScheduledService extends ApplicationScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig<ApplicationScheduledService> {
    return { priority: 'not_urgent' }
  }
}

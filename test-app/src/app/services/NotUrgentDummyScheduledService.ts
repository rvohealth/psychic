import { BackgroundJobConfig } from '../../../../src'
import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class NotUrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig {
    return { priority: 'not_urgent' }
  }
}

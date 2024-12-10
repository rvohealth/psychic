import { BackgroundJobConfig } from '../../../../src'
import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class UrgentDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig {
    return { priority: 'urgent' }
  }
}

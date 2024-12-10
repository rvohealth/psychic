import { BackgroundJobConfig } from '../../../../src'
import BaseDummyScheduledService from './BaseDummyScheduledService'

export default class LastDummyScheduledService extends BaseDummyScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig {
    return { priority: 'last' }
  }
}

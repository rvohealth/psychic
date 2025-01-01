import { BackgroundJobConfig } from '../../../../src'
import ScheduledService from './ScheduledService'

export default class LastDummyScheduledService extends ScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig<ScheduledService> {
    return { priority: 'last' }
  }
}

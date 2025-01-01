import { BackgroundJobConfig } from '../../../../src'
import ScheduledService from './ScheduledService'

export default class NotUrgentDummyScheduledService extends ScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig<ScheduledService> {
    return { priority: 'not_urgent' }
  }
}

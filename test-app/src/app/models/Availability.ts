import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'
import User from './User.js'

const deco = new Decorators<typeof Availability>()

export default class Availability extends ApplicationModel {
  public override get table() {
    return 'availabilities' as const
  }

  public get serializers(): DreamSerializers<Availability> {
    return {
      default: 'AvailabilitySerializer',
      summary: 'AvailabilitySummarySerializer',
    }
  }

  public id: DreamColumn<Availability, 'id'>
  public start: DreamColumn<Availability, 'start'>
  public starttz: DreamColumn<Availability, 'starttz'>
  public end: DreamColumn<Availability, 'end'>
  public endtz: DreamColumn<Availability, 'endtz'>
  public times: DreamColumn<Availability, 'times'>
  public timetzs: DreamColumn<Availability, 'timetzs'>
  public createdAt: DreamColumn<Availability, 'createdAt'>
  public updatedAt: DreamColumn<Availability, 'updatedAt'>

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Availability, 'userId'>
}

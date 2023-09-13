import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import User from './User'
import { SpeciesTypesEnum } from '../../db/schema'
import ApplicationModel from './ApplicationModel'

export default class Pet extends ApplicationModel {
  public get table() {
    return 'pets' as const
  }

  public id: IdType
  public name: string
  public species: SpeciesTypesEnum
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => User)
  public user: User
  public userId: IdType
}

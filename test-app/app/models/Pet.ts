import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import User from './User'
import { SpeciesTypesEnum } from '../../db/schema'

export default class Pet extends Dream {
  public get table() {
    return 'pets' as const
  }

  public id: IdType
  public name: string
  public species: SpeciesTypesEnum
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType
}
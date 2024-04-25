import { IdType, BelongsTo, DreamColumn } from '@rvohealth/dream'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class Pet extends ApplicationModel {
  public get table() {
    return 'pets' as const
  }

  public id: DreamColumn<Pet, 'id'>
  public name: DreamColumn<Pet, 'name'>
  public species: DreamColumn<Pet, 'species'>
  public collarCount: DreamColumn<Pet, 'collarCount'>
  public collarCountInt: DreamColumn<Pet, 'collarCountInt'>
  public likesWalks: DreamColumn<Pet, 'likesWalks'>
  public likesTreats: DreamColumn<Pet, 'likesTreats'>
  public lastSeenAt: DreamColumn<Pet, 'lastSeenAt'>
  public createdAt: DreamColumn<Pet, 'createdAt'>
  public updatedAt: DreamColumn<Pet, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: IdType
}

import { IdType, BelongsTo, DreamColumn } from '@rvohealth/dream'
import User from './User'
import ApplicationModel from './ApplicationModel'
import PetSerializer, { PetAdditionalSerializer, PetIndexSerializer } from '../serializers/PetSerializer'

export default class Pet extends ApplicationModel {
  public get table() {
    return 'pets' as const
  }

  public get serializers() {
    return {
      default: PetSerializer,
      index: PetIndexSerializer,
      additional: PetAdditionalSerializer,
    }
  }

  public id: DreamColumn<Pet, 'id'>
  public name: DreamColumn<Pet, 'name'>
  public species: DreamColumn<Pet, 'species'>
  public favoriteTreats: DreamColumn<Pet, 'favoriteTreats'>
  public collarCount: DreamColumn<Pet, 'collarCount'>
  public collarCountInt: DreamColumn<Pet, 'collarCountInt'>
  public collarCountNumeric: DreamColumn<Pet, 'collarCountNumeric'>
  public requiredCollarCount: DreamColumn<Pet, 'requiredCollarCount'>
  public requiredCollarCountInt: DreamColumn<Pet, 'requiredCollarCountInt'>
  public requiredCollarCountNumeric: DreamColumn<Pet, 'requiredCollarCountNumeric'>
  public likesWalks: DreamColumn<Pet, 'likesWalks'>
  public likesTreats: DreamColumn<Pet, 'likesTreats'>
  public lastSeenAt: DreamColumn<Pet, 'lastSeenAt'>
  public lastHeardAt: DreamColumn<Pet, 'lastHeardAt'>
  public createdAt: DreamColumn<Pet, 'createdAt'>
  public updatedAt: DreamColumn<Pet, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: IdType
}

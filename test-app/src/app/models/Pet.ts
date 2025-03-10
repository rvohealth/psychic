import { Decorators, DreamColumn, DreamSerializers, IdType } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'

const Deco = new Decorators<InstanceType<typeof Pet>>()

export default class Pet extends ApplicationModel {
  public get table() {
    return 'pets' as const
  }

  public get serializers(): DreamSerializers<Pet> {
    return {
      default: 'PetSerializer',
      summary: 'PetSummarySerializer',
      additional: 'PetAdditionalSerializer',
      withAssociation: 'PetWithAssociationSerializer',
      withFlattenedAssociation: 'PetWithFlattenedAssociationSerializer',
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

  @Deco.BelongsTo('User')
  public user: User
  public userId: IdType
}

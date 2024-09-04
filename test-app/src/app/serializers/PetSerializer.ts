import { Attribute, DreamColumn, DreamSerializer, RendersOne } from '@rvohealth/dream'
import Pet from '../models/Pet'
import User from '../models/User'
import UserSerializer from './UserSerializer'

export class PetSummarySerializer extends DreamSerializer {
  @Attribute(Pet)
  public id: DreamColumn<Pet, 'id'>
}

export default class PetSerializer extends PetSummarySerializer {
  @Attribute(Pet)
  public name: DreamColumn<Pet, 'name'>
}

export class PetAdditionalSerializer extends PetSummarySerializer {
  @Attribute('string')
  public nickname: 'string'
}

export class PetWithAssociationSerializer extends DreamSerializer {
  @RendersOne(() => UserSerializer)
  public user: User
}

import { Attribute, DreamColumn, DreamSerializer, RendersOne } from '@rvoh/dream'
import Pet from '../models/Pet'
import User from '../models/User'

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
  @RendersOne(User)
  public user: User
}

export class PetWithFlattenedAssociationSerializer extends DreamSerializer {
  @RendersOne(User, { serializerKey: 'withFlattenedPost' })
  public user: User
}

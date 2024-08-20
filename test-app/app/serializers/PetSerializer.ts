import { Attribute, DreamSerializer, RendersOne } from '@rvohealth/dream'
import User from '../models/User'
import UserSerializer from './UserSerializer'

export class PetSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class PetSerializer extends PetSummarySerializer {
  @Attribute()
  public name: string
}

export class PetAdditionalSerializer extends PetSummarySerializer {
  @Attribute('string')
  public nickname: string
}

export class PetWithAssociationSerializer extends DreamSerializer {
  @RendersOne(() => UserSerializer)
  public user: User
}

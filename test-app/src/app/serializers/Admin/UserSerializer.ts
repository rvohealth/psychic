import { Attribute, DreamSerializer, RendersMany } from '@rvoh/dream'
import Pet from '../../models/Pet.js'
import { AdminPetSummarySerializer } from './PetSerializer.js'

export class AdminUserSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class AdminUserSerializer extends AdminUserSummarySerializer {
  @Attribute('string')
  public name: string

  @RendersMany(() => AdminPetSummarySerializer)
  public pets: Pet[]
}

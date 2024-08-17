import { Attribute, DreamSerializer, RendersMany } from '@rvohealth/dream'
import Pet from '../../models/Pet'
import { AdminPetSummarySerializer } from './PetSerializer'

export class AdminUserSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class AdminUserSerializer extends AdminUserSummarySerializer {
  @Attribute('string')
  public name: string

  @RendersMany(AdminPetSummarySerializer)
  public pets: Pet[]
}

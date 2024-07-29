import { Attribute, DreamSerializer } from '@rvohealth/dream'

export class AdminV2PetSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class AdminV2PetSerializer extends AdminV2PetSummarySerializer {
  @Attribute()
  public name: string
}

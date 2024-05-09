import { DreamSerializer, Attribute } from '@rvohealth/dream'

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

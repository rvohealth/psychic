import { DreamSerializer, Attribute } from '@rvohealth/dream'

export class PetIndexSerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class PetSerializer extends PetIndexSerializer {
  @Attribute()
  public name: string
}

export class PetAdditionalSerializer extends PetIndexSerializer {
  @Attribute('string')
  public nickname: string
}

import { Attribute, DreamSerializer } from '@rvoh/dream'

export class AdminPetSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class AdminPetSerializer extends AdminPetSummarySerializer {
  @Attribute()
  public name: string
}

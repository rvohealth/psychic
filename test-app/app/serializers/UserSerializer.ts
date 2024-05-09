import { DreamSerializer, Attribute } from '@rvohealth/dream'

export class UserSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class UserSerializer extends UserSummarySerializer {
  @Attribute('string')
  public email: string

  @Attribute('string')
  public name: string
}

export class UserExtraSerializer extends UserSummarySerializer {
  @Attribute('string[]')
  public nicknames: string[]
}

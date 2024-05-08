import { DreamSerializer, Attribute } from '@rvohealth/dream'

export class UserIndexSerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class UserSerializer extends UserIndexSerializer {
  @Attribute('string')
  public email: string

  @Attribute('string')
  public name: string
}

export class UserExtraSerializer extends UserIndexSerializer {
  @Attribute('string[]')
  public nicknames: string[]
}

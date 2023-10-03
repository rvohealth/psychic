import { DreamSerializer, Attribute } from '@rvohealth/dream'

export default class UserSerializer extends DreamSerializer {
  @Attribute()
  public email: string

  @Attribute()
  public name: string
}

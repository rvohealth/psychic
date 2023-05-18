import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer {
  @Attribute()
  public email: string

  @Attribute()
  public name: string
}

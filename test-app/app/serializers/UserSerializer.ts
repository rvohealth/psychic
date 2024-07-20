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

  @Attribute({
    type: 'object',
    properties: {
      name: 'string',
      stuff: 'string[]',
      nestedStuff: {
        type: 'object',
        properties: {
          nested1: 'boolean',
          nested2: 'decimal[]',
        },
      },
    },
  })
  public howyadoin() {}
}

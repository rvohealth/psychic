import generateSerializerString from '../../../../src/generate/helpers/generateSerializerString'

describe('howl generate:serializer <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('when serializer matches a pluralized version of a model', () => {
      it('generates a serializer adding requested attributes, as well as those on the model discovered', async () => {
        const res = await generateSerializerString('user', ['logged_in_at'])

        expect(res).toEqual(
          `\
import { HowlSerializer } from 'howl'

export default class UserSerializer extends HowlSerializer {
  static {
    this
      .attributes(
        'id',
        'name',
        'email',
        'password_digest',
        'created_at',
        'updated_at',
        'logged_in_at'
      )
  }
}\
`
        )
      })
    })
  })
})

import generateSerializerString from '../../../../src/generate/helpers/generateSerializerString'

describe('psy generate:serializer <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('when serializer matches a pluralized version of a model', () => {
      it('generates a serializer adding requested attributes, as well as those on the model discovered', async () => {
        const res = await generateSerializerString('user', ['logged_in_at'])

        expect(res).toEqual(
          `\
import { PsychicSerializer } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  static {
    this
      .attributes(
        'id',
        'email',
        'password_digest',
        'name',
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

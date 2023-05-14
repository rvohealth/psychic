import generateSerializerString from '../../../../src/generate/helpers/generateSerializerString'

describe('psy generate:serializer <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('when serializer matches a pluralized version of a model', () => {
      it('generates a serializer adding requested attributes, as well as those on the model discovered', async () => {
        const res = await generateSerializerString('UserSerializer', 'User', ['logged_in_at'])

        expect(res).toEqual(
          `\
import { PsychicSerializer, Attribute } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  @Attribute()
  public logged_in_at: any
}\
`
        )
      })
    })

    context('when passed type-decorated attributes', () => {
      context('one of those attributes is a string', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerString('UserSerializer', 'User', ['howyadoin:string'])

          expect(res).toEqual(
            `\
import { PsychicSerializer, Attribute } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  @Attribute()
  public howyadoin: string
}\
`
          )
        })
      })

      context('one of those attributes is a number', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerString('UserSerializer', 'User', ['howyadoin:number'])

          expect(res).toEqual(
            `\
import { PsychicSerializer, Attribute } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  @Attribute()
  public howyadoin: number
}\
`
          )
        })
      })

      context('one of those attributes is a decimal', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerString('UserSerializer', 'User', ['howyadoin:decimal:4,2'])

          expect(res).toEqual(
            `\
import { PsychicSerializer, Attribute } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  @Attribute()
  public howyadoin: number
}\
`
          )
        })
      })

      context('one of those attributes is a datetime', () => {
        it('adds a DateTime type to the field', async () => {
          const res = await generateSerializerString('UserSerializer', 'User', ['logged_in_at:datetime'])

          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { PsychicSerializer, Attribute } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  @Attribute()
  public logged_in_at: DateTime
}\
`
          )
        })
      })

      context('one of those attributes is a date', () => {
        it('adds a DateTime type to the field, and a date specifier to the Attribute statement', async () => {
          const res = await generateSerializerString('UserSerializer', 'User', ['logged_in_on:date'])

          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { PsychicSerializer, Attribute } from 'psychic'

export default class UserSerializer extends PsychicSerializer {
  @Attribute('date')
  public logged_in_on: DateTime
}\
`
          )
        })
      })
    })
  })
})

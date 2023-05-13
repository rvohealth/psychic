import { DateTime } from 'luxon'
import PsychicSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import User from '../../../test-app/app/models/User'

describe('PsychicSerializer#render', () => {
  it('renders a single attribute', () => {
    class MySerializer extends PsychicSerializer {
      @Attribute()
      public email: string
    }
    const serializer = new MySerializer({ email: 'abc', password: '123' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  it('renders multiple attributes', () => {
    class MySerializer extends PsychicSerializer {
      @Attribute()
      public email: string

      @Attribute()
      public name: string
    }
    const serializer = new MySerializer({ email: 'abc', name: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc', name: 'james' })
  })

  it('excludes hidden attributes', () => {
    class MySerializer extends PsychicSerializer {
      @Attribute()
      public email: string

      @Attribute()
      public name: string
    }
    const serializer = new MySerializer({ email: 'abc', password: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  context('with decorated attributes', () => {
    context('one of the fields is a date', () => {
      it('renders unique format for dates', () => {
        class MySerializer extends PsychicSerializer {
          @Attribute('date')
          public created_at: string
        }
        const serializer = new MySerializer({ created_at: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.render()).toEqual({ created_at: '2002-10-02' })
      })
    })
  })

  context('with casing specified', () => {
    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        class MySerializer extends PsychicSerializer {
          @Attribute('date')
          public created_at: string
        }
        const serializer = new MySerializer({ createdAt: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.casing('snake').render()).toEqual({ created_at: '2002-10-02' })
      })

      context('serializer has non-snake-cased attributes in definition', () => {
        it('converts attributes to snake case as well', () => {
          class MySerializer extends PsychicSerializer {
            @Attribute('date')
            public createdAt: string
          }
          const serializer = new MySerializer({ createdAt: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
          expect(serializer.casing('snake').render()).toEqual({ created_at: '2002-10-02' })
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        class MySerializer extends PsychicSerializer {
          @Attribute('date')
          public createdAt: string
        }
        const serializer = new MySerializer({ created_at: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.casing('camel').render()).toEqual({ createdAt: '2002-10-02' })
      })

      context('serializer has non-camel-cased attributes in definition', () => {
        it('converts attributes to camel case as well', () => {
          class MySerializer extends PsychicSerializer {
            @Attribute('date')
            public created_at: string
          }
          const serializer = new MySerializer({ created_at: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
          expect(serializer.casing('camel').render()).toEqual({ createdAt: '2002-10-02' })
        })
      })
    })
  })

  context('when passed a dream instance', () => {
    class MySerializer extends PsychicSerializer {
      @Attribute()
      public email: string
    }

    it('serializes the attributes of the dream', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const serializer = new MySerializer(user)
      expect(serializer.render()).toEqual({ email: 'how@yadoin' })
    })

    context('given an array of dream instances', () => {
      it('renders all passed dreams to the shape specified by the serializer', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const serializer = new MySerializer([user])
        expect(serializer.render()).toEqual([{ email: 'how@yadoin' }])
      })
    })
  })
})

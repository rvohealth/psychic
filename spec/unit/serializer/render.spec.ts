import { DateTime } from 'luxon'
import PsychicSerializer from '../../../src/serializer'

describe('PsychicSerializer#render', () => {
  it('renders a single attribute', () => {
    class MySerializer extends PsychicSerializer {
      static {
        this.attribute('email')
      }
    }
    const serializer = new MySerializer({ email: 'abc', password: '123' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  it('renders multiple attributes', () => {
    class MySerializer extends PsychicSerializer {
      static {
        this.attributes('email', 'name')
      }
    }
    const serializer = new MySerializer({ email: 'abc', name: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc', name: 'james' })
  })

  it('excludes hidden attributes', () => {
    class MySerializer extends PsychicSerializer {
      static {
        this.attributes('email', 'name')
      }
    }
    const serializer = new MySerializer({ email: 'abc', password: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  context('with decorated attributes', () => {
    context('one of the fields is a date', () => {
      it('renders unique format for dates', () => {
        class MySerializer extends PsychicSerializer {
          static {
            this.attributes('created_at:date')
          }
        }
        const serializer = new MySerializer({ created_at: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.render()).toEqual({ created_at: '2002-10-02' })
      })
    })
  })
})

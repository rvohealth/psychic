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
})

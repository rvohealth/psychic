import Params from '../../../src/server/params'

describe('Params', () => {
  describe('#restrict', () => {
    it('restricts attributes to only those passed', () => {
      expect(Params.restrict({ name: 'howyadoin', email: 'hello' }, ['name'])).toEqual({ name: 'howyadoin' })
    })

    context('one of the desired attributes is null', () => {
      it('allows null to pass through', () => {
        expect(Params.restrict({ name: null, email: 'hello' }, ['name'])).toEqual({
          name: null,
        })
      })
    })

    context('one of the desired attributes is false', () => {
      it('allows false to pass through', () => {
        expect(Params.restrict({ name: false, email: 'hello' }, ['name'])).toEqual({
          name: false,
        })
      })
    })

    context('one of the desired attributes is undefined', () => {
      it('omits undefined', () => {
        expect(Object.keys(Params.restrict({ name: undefined, email: 'hello' }, ['name']))).toEqual([])
      })
    })
  })
})

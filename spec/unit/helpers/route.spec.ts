import route from '../../../test-app/app/helpers/route'

describe('route', () => {
  it('returns the route passed to it (providing type assertions in this case)', () => {
    expect(route('/api/users/:userId/pets/:id')).toEqual('/api/users/:userId/pets/:id')
  })

  describe('context: given interpolation args', () => {
    it('interpolates args for a given route path', () => {
      expect(route('/api/users/:userId/pets/:id', 123, 456)).toEqual('/api/users/123/pets/456')
    })
  })
})

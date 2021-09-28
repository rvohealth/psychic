import { create } from 'spec/factories'

describe ('Dream#hasUnsavedAttribute', () => {
  it ('returns false', async () => {
    const TestUser = create('dream.TestUser')
    const dream = new TestUser()
    posess(dream, 'isNewRecord', 'get').returning(false)
    expect(dream.hasUnsavedAttribute('email')).toEqual(false)
  })

  context ('new record', () => {
    it ('returns true', async () => {
      const TestUser = create('dream.TestUser')
      const dream = new TestUser()
      expect(dream.hasUnsavedAttribute('email')).toEqual(true)
    })
  })

  context ('an attribute has changed, and it is not a new record', () => {
    it ('returns true', async () => {
      const TestUser = create('dream.TestUser')
      const dream = new TestUser()
      posess(dream, 'isNewRecord', 'get').returning(false)

      dream.email = 'fishman'
      expect(dream.hasUnsavedAttribute('email')).toEqual(true)
      expect(dream.hasUnsavedAttribute('id')).toEqual(false)
    })
  })
})

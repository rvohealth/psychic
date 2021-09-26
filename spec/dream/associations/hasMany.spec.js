import { create } from 'spec/factories'
import HasMany from 'src/dream/association/has-many'
import HasManyThrough from 'src/dream/association/has-many-through'
import InvalidThroughArgument from 'src/error/dream/association/invalid-through-argument'

describe('Dream#hasMany', () => {
  it ('registers the association, adding accessor methods', async () => {
    const Post = create('dream.Post')
    const post = Post.new()
    const hasManyStub = {
      fish: 10,
      resourceName: 'test_user',
    }

    posess(HasMany, 'new').returning(hasManyStub)

    expect(post._associations).toEqual({})
    expect(post.test_user).toBe(undefined)
    expect(post.testUser).toBe(undefined)

    post.hasMany('test_user')

    expect(post._associations).toEqual({
      test_user: hasManyStub,
    })

    expect(post.test_user.constructor.name).toBe('Function')
    expect(post.testUser.constructor.name).toBe('Function')
    expect(post.testUser).toBe(post.test_user)
  })

  context ('through is specified', () => {
    it ('uses has many through association', async () => {
      const TestUser = create('dream.TestUser')
      create('dream.Spouse')
      create('dream.MotherInLaw')

      const user = TestUser.new()
      expect(user._associations).toEqual({})

      user.hasMany('spouse')

      const hasManyThroughStub = {
        fish: 10,
        resourceName: 'mother_in_law',
      }
      posess(HasManyThrough, 'new').returning(hasManyThroughStub)

      expect(user.mother_in_law).toBe(undefined)
      expect(user.motherInLaw).toBe(undefined)

      user.hasMany('mother_in_law', { through: 'spouse' })

      expect(user._associations.mother_in_law).toEqual(hasManyThroughStub)

      expect(user.mother_in_law.constructor.name).toBe('Function')
      expect(user.motherInLaw.constructor.name).toBe('Function')
      expect(user.motherInLaw).toBe(user.mother_in_law)
    })

    context ('when through is invalid', () => {
      it ('raises exception', async () => {
        const TestUser = create('dream.TestUser')
        create('dream.Spouse')
        create('dream.MotherInLaw')

        const user = TestUser.new()
        expect(user._associations).toEqual({})

        expect(() => {
          user.hasMany('spouse', { through: 'somethingundefined' })
        }).toThrow(InvalidThroughArgument)
      })
    })
  })
})

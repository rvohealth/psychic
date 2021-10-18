import { create } from 'spec/factories'
import HasMany from 'src/dream/association/has-many'
import HasManyThrough from 'src/dream/association/has-many-through'
import InvalidThroughArgument from 'src/error/dream/association/invalid-through-argument'

describe('Dream#hasMany', () => {
  it ('registers the association, adding accessor methods', async () => {
    const Post = create('dream.Post')
    const post = Post.new()
    const hasManyStub = {
      fish: 30,
      resourceName: 'test_user',
    }

    posess(HasMany, 'new').returning(hasManyStub)

    expect(Post._associations).toEqual({})
    expect(post.test_user).toBe(undefined)
    expect(post.testUser).toBe(undefined)

    Post.hasMany('test_user')

    expect(Post._associations).toEqual({
      test_user: hasManyStub,
    })

    const post2 = Post.new()
    expect(post2.test_user.constructor.name).toBe('Function')
    expect(post2.testUser.constructor.name).toBe('Function')
    expect(post2.testUser).toBe(post.test_user)
  })

  context ('through is specified', () => {
    it ('uses has many through association', async () => {
      const TestUser = create('dream.TestUser')
      create('dream.Spouse')
      create('dream.MotherInLaw')

      const user = TestUser.new()

      TestUser.hasMany('spouse')

      const hasManyThroughStub = {
        fish: 20,
        resourceName: 'mother_in_law',
      }
      posess(HasManyThrough, 'new').returning(hasManyThroughStub)

      expect(user.mother_in_law).toBe(undefined)
      expect(user.motherInLaw).toBe(undefined)

      TestUser.hasMany('mother_in_law', { through: 'spouse' })

      expect(TestUser._associations.mother_in_law).toEqual(hasManyThroughStub)

      const user2 = TestUser.new()
      expect(user2.mother_in_law.constructor.name).toBe('Function')
      expect(user2.motherInLaw.constructor.name).toBe('Function')
      expect(user2.motherInLaw).toBe(user.mother_in_law)
    })

    context ('when through is invalid', () => {
      it ('raises exception', async () => {
        const TestUser = create('dream.TestUser')
        create('dream.Spouse')
        create('dream.MotherInLaw')

        const user = TestUser.new()
        expect(user._associations).toEqual({})

        expect(() => {
          TestUser.hasMany('spouse', { through: 'somethingundefined' })
        }).toThrow(InvalidThroughArgument)
      })
    })
  })
})

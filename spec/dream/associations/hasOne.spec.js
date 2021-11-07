import { create } from 'spec/factories'
import HasOne from 'src/dream/association/has-one'
import HasOneThrough from 'src/dream/association/has-one-through'
import InvalidThroughArgument from 'src/error/dream/association/invalid-through-argument'

describe('Dream#hasOne', () => {
  it ('registers the association, adding accessor methods', async () => {
    const Post = create('dream.Post')
    const post = Post.new()
    const hasOneStub = {
      fish: 10,
      resourceName: 'test_user',
    }

    posess(HasOne, 'new').returning(hasOneStub)

    expect(Post._associations).toEqual({})
    expect(post.test_user).toBe(undefined)
    expect(post.testUser).toBe(undefined)

    Post.hasOne('test_user')

    expect(Post._associations).toEqual({
      test_user: hasOneStub,
    })

    const post2 = Post.new()
    expect(post2.test_user.constructor.name).toBe('Function')
    expect(post2.testUser.constructor.name).toBe('Function')
  })

  context ('through is specified', () => {
    it ('uses has one through association', async () => {
      const TestUser = create('dream.TestUser')
      create('dream.Spouse')
      create('dream.MotherInLaw')

      const user = TestUser.new()

      TestUser.hasOne('spouse')

      const hasOneThroughStub = {
        fish: 10,
        resourceName: 'mother_in_law',
      }
      posess(HasOneThrough, 'new').returning(hasOneThroughStub)

      expect(user.mother_in_law).toBe(undefined)
      expect(user.motherInLaw).toBe(undefined)

      TestUser.hasOne('mother_in_law', { through: 'spouse' })

      expect(TestUser._associations.mother_in_law).toEqual(hasOneThroughStub)

      const user2 = TestUser.new()
      expect(user2.mother_in_law.constructor.name).toBe('Function')
      expect(user2.motherInLaw.constructor.name).toBe('Function')
    })

    context ('when through is invalid', () => {
      it ('raises exception', async () => {
        const TestUser = create('dream.TestUser')
        create('dream.Spouse')
        create('dream.MotherInLaw')

        expect(() => {
          TestUser.hasOne('spouse', { through: 'somethingundefined' })
        }).toThrow(InvalidThroughArgument)
      })
    })
  })
})

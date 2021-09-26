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

    expect(post._associations).toEqual({})
    expect(post.test_user).toBe(undefined)
    expect(post.testUser).toBe(undefined)

    post.hasOne('test_user')

    expect(post._associations).toEqual({
      test_user: hasOneStub,
    })

    expect(post.test_user.constructor.name).toBe('Function')
    expect(post.testUser.constructor.name).toBe('Function')
    expect(post.testUser).toBe(post.test_user)
  })

  context ('through is specified', () => {
    it ('uses has one through association', async () => {
      const TestUser = create('dream.TestUser')
      create('dream.Spouse')
      create('dream.MotherInLaw')

      const user = TestUser.new()
      expect(user._associations).toEqual({})

      user.hasOne('spouse')

      const hasOneThroughStub = {
        fish: 10,
        resourceName: 'mother_in_law',
      }
      posess(HasOneThrough, 'new').returning(hasOneThroughStub)

      expect(user.mother_in_law).toBe(undefined)
      expect(user.motherInLaw).toBe(undefined)

      user.hasOne('mother_in_law', { through: 'spouse' })

      expect(user._associations.mother_in_law).toEqual(hasOneThroughStub)

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
          user.hasOne('spouse', { through: 'somethingundefined' })
        }).toThrow(InvalidThroughArgument)
      })
    })
  })
})

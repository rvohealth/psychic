import { create } from 'spec/factories'
import BelongsTo from 'src/dream/association/belongs-to'

describe('Dream#belongsTo', () => {
  it ('registers the association, adding accessor methods', async () => {
    const Post = create('dream.Post')
    const post = Post.new()
    const belongsToStub = {
      fish: 10,
      resourceName: 'test_user',
    }

    posess(BelongsTo, 'new').returning(belongsToStub)

    expect(post._associations).toEqual({})
    expect(post.test_user).toBe(undefined)
    expect(post.testUser).toBe(undefined)

    post.belongsTo('test_user')

    expect(post._associations).toEqual({
      test_user: belongsToStub,
    })

    expect(post.test_user.constructor.name).toBe('Function')
    expect(post.testUser.constructor.name).toBe('Function')
    expect(post.testUser).toBe(post.test_user)
  })
})

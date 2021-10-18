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

    expect(Post._associations).toEqual({})
    expect(post.test_user).toBe(undefined)
    expect(post.testUser).toBe(undefined)

    Post.belongsTo('test_user')

    expect(Post._associations).toEqual({
      test_user: belongsToStub,
    })

    const post2 = Post.new()
    expect(post2.test_user.constructor.name).toBe('Function')
    expect(post2.testUser.constructor.name).toBe('Function')
    expect(post2.testUser).toBe(post.test_user)
  })
})

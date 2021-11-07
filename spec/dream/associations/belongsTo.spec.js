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
    expect(typeof post2.test_user).toBe('function')
    expect(typeof post2.testUser).toBe('function')
  })
})

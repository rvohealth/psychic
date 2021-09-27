import esp from 'src/esp'
import { create } from 'spec/factories'
import InvalidEmitRelationNameArgument from 'src/error/dream/ws/emits/invalid-relation-name-argument'

describe('Dream.emit', () => {
  it ('calls to esp.transmit', async () => {
    const TestUser = create('dream.TestUser')
    const Post = create('dream.Post')

    const user = new TestUser()
    const post = new Post()
    const spy = posess(esp, 'transmit')
    post
      .belongsTo('testUser')
      .emitsTo('testUser', { as: 'currentUser' })

    posess(user, '_association').returning(true)
    posess(post, 'testUser').returning({ id: 12345 })

    await post.emit('testUser', '/ws/path', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('ws:to:authToken', {
      to: 'currentUser',
      id: 12345,
      path: '/ws/path'.replace(/^\//, ''),
      data: { fish: 10 },
    })
  })

  context ('no record is found for that association', () => {
    it ('does not call to esp', async () => {
    })
  })

  context ('the source attempting to emit to does not exist', () => {
    it ('throws an exception', async () => {
      const TestUser = create('dream.TestUser')
      const Post = create('dream.Post')

      const user = new TestUser()
      const post = new Post()
      posess(esp, 'transmit')

      post
        .belongsTo('testUser')
        .emitsTo('testUser', { as: 'currentUser' })

      posess(user, '_association').returning(true)
      posess(post, 'testUser').returning({ id: 12345 })

      await expect(async () => {
        await post.emit('invalid', '/ws/path', { fish: 10 })
      }).toThrowAsync(InvalidEmitRelationNameArgument)
    })
  })
})

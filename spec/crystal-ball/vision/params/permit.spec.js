import Params from 'src/crystal-ball/params'

const userObject ={
  name: 'fish',
  email: 'fish@fish',
  unpermittedthing: 'unpermittedthing',
}

const params = new Params({
  body: {
    user: userObject,
  },
  uri: {
    id: '123',
  },
  query: {
    search: 'abc',
  }
})

describe('CrystalBall#auth', () => {
  it ('assigns getters to params base', () => {
    expect(params.user).toEqual(userObject)
    expect(params.id).toEqual('123')
    expect(params.search).toEqual('abc')
  })

  it ('returns an object containing only the filtered params', () => {
    const result = params
      .require('user')
      .permit('name', 'email')

    expect(result).toEqual(
      expect.objectContaining({ name: 'fish', email: 'fish@fish' })
    )
  })
})

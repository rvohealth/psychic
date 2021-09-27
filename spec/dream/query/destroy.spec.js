import { create } from 'spec/factories'
import Query from 'src/db/query'

describe('Dream#destroy', () => {
  it ('calls to Query interface correctly', async () => {
    const TestUser = create('dream.TestUser')
    const user = new TestUser()
    const query = new Query()
    const deleteSpy = posess(query, 'delete').returning(query)
    const whereSpy = posess(query, 'where').returning(query)
    const doSpy = posess(query, 'do').returning(true)
    const runHooksSpy = posess(user, '_runHooksFor').returning(true)
    posess(Query, 'new').returning(query)
    posess(user, 'id', 'get').returning(12345)

    const result = await user.destroy()

    expect(result).toEqual(true)
    expect(runHooksSpy).toHaveBeenCalledWith('beforeDestroy')
    expect(deleteSpy).toHaveBeenCalledWith('test_users')
    expect(whereSpy).toHaveBeenCalledWith({ id: 12345 })
    expect(doSpy).toHaveBeenCalled()
    expect(runHooksSpy).toHaveBeenCalledWith('afterDestroy')
  })
})


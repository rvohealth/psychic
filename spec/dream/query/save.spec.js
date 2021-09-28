import { create } from 'spec/factories'
import db from 'src/db'
import Query from 'src/db/query'

describe('Dream#save', () => {
  it ('calls to Query interface correctly, applying callbacks and validations before and after', async () => {
    const TestUser = create('dream.TestUser')
    const user = new TestUser()
    const query = new Query()
    const runHooksSpy = posess(user, '_runHooksFor').returning(true)
    const runValidationsSpy = posess(user, '_runValidations').returning(true)
    const resetAttributesSpy = posess(user, '_resetAttributes').returning(true)
    const insertSpy = posess(db, 'insert').returning({ id: 1, email: 'something' })
    posess(Query, 'new').returning(query)
    posess(user, 'id', 'get').returning(12345)
    posess(user, 'isNewRecord', 'get').returning(true)

    user.email = 'something'
    const result = await user.save()

    expect(result).toEqual(user)
    expect(runHooksSpy).toHaveBeenCalledWith('beforeSave')
    expect(runHooksSpy).toHaveBeenCalledWith('beforeCreate')
    expect(resetAttributesSpy).toHaveBeenCalledWith({ id: 1, email: 'something' })
    expect(runValidationsSpy).toHaveBeenCalled()
    expect(insertSpy).toHaveBeenCalledWith(user.table, { email: 'something' })
    expect(runHooksSpy).toHaveBeenCalledWith('afterCreate')
  })

  context ('the record is already persisted', () => {
    it ('calls to Query interface correctly, applying callbacks and validations before and after', async () => {
      const TestUser = create('dream.TestUser')
      const user = new TestUser()
      const query = new Query()
      const updateSpy = posess(db, 'update').returning(query)
      const whereSpy = posess(query, 'where').returning(query)
      const doSpy = posess(query, 'do').returning([{ id: 12345, email: 'something' }])
      const runHooksSpy = posess(user, '_runHooksFor').returning(true)
      const runValidationsSpy = posess(user, '_runValidations').returning(true)
      const resetAttributesSpy = posess(user, '_resetAttributes').returning(true)
      posess(Query, 'new').returning(query)
      posess(user, 'id', 'get').returning(12345)
      posess(user, 'isNewRecord', 'get').returning(false)

      user.email = 'something'
      const result = await user.save()

      expect(result).toEqual(user)
      expect(runHooksSpy).toHaveBeenCalledWith('beforeSave')
      expect(runHooksSpy).toHaveBeenCalledWith('beforeUpdate')
      expect(resetAttributesSpy).toHaveBeenCalledWith({ id: 12345, email: 'something' })
      expect(runValidationsSpy).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(user.table, { email: 'something' })
      expect(whereSpy).toHaveBeenCalledWith({ id: 12345 })
      expect(doSpy).toHaveBeenCalled()
      expect(runHooksSpy).toHaveBeenCalledWith('afterUpdate')
    })
  })
})


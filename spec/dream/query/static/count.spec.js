import Dream from 'src/dream'
import db from 'src/db'

describe('Dream.count', () => {
  it ('calls to db and executes query', async () => {
    const doSpy = eavesdrop().returning({ fish: 10 })
    const countSpy = posess(db, 'count').returning({ do: doSpy })
    posess(Dream, 'table', 'get').returning('fishmen')

    const result = await Dream.count()
    expect(result).toEqual({ fish: 10 })
    expect(countSpy).toHaveBeenCalledWith('fishmen')
    expect(doSpy).toHaveBeenCalled()
  })
})

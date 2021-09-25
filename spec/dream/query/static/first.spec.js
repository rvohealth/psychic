import Dream from 'src/dream'
import Query from 'src/db/query'

describe('Dream.first', () => {
  it ('calls to Query interface correctly', async () => {
    const query = new Query()
    posess(Dream, 'table', 'get').returning('fishmen')
    const selectSpy = posess(query, 'select').returning(query)
    const newSpy = posess(Query, 'new').returning(query)
    const fromSpy = posess(query, 'from').returning(query)
    const firstSpy = posess(query, 'first').returning({ fish: 10 })

    const result = await Dream.first(10)
    expect(result).toEqual({ fish: 10 })

    expect(newSpy).toHaveBeenCalledWith(Dream)
    expect(selectSpy).toHaveBeenCalledWith('*')
    expect(fromSpy).toHaveBeenCalledWith('fishmen')
    expect(firstSpy).toHaveBeenCalled()
  })
})

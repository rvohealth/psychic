import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()

describe('Migrate#dropColumn', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'dropColumn').mockReturnValue({})

    await migrate.dropColumn('hamncheese', 'fish')
    expect(spy).toHaveBeenCalledWith('hamncheese', 'fish')
    spy.mockRestore()
  })
})

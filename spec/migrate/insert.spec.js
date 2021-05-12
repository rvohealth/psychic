import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()

describe('Migrate#insert', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'insert').mockReturnValue({})

    await migrate.insert('hamncheese', [{}])
    expect(spy).toHaveBeenCalledWith('hamncheese', [{}])
    spy.mockRestore()
  })
})

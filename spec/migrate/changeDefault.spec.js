import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()

describe('Migrate#changeDefault', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'changeDefault').mockReturnValue({})

    await migrate.changeDefault('hamncheese', 'fishman', 1)
    expect(spy).toHaveBeenCalledWith('hamncheese', 'fishman', 1)
    spy.mockRestore()
  })
})

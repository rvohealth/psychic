import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()

describe('Migrate#renameColumn', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'renameColumn').mockReturnValue({})

    await migrate.renameColumn('hamncheese', 'fish', 'fish2')
    expect(spy).toHaveBeenCalledWith('hamncheese', 'fish', 'fish2')
    spy.mockRestore()
  })
})

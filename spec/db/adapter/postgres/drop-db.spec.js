import { jest } from '@jest/globals'
import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()
let spy

describe('PostgresAdapter.db#drop', () => {
  beforeEach(() => {
    spy = jest
      .spyOn(postgres, 'runRootSQL')
      .mockImplementation(() => true)
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it ('runs create database sql, passing db name', async () => {
    await postgres.dropDB('hamncheese')
    expect(spy).toHaveBeenCalledWith('DROP DATABASE hamncheese')
  })

  describe ('no db name is passed', () => {
    it ('uses db name from env', async () => {
      await postgres.dropDB()
      expect(spy).toHaveBeenCalledWith(`DROP DATABASE ${ENV.PSYCHIC_CORE_DB_NAME}`)
    })
  })
})

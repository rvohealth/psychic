import { jest } from '@jest/globals'
import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()
let spy

describe('PostgresAdapter.db#create', () => {
  beforeEach(() => {
    spy = jest
      .spyOn(postgres, 'runRootSQL')
      .mockImplementation(() => true)
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it ('runs create database sql, passing db name', async () => {
    await postgres.createDB('hamncheese')
    expect(spy).toHaveBeenCalledWith('CREATE DATABASE hamncheese')
  })

  describe ('no db name is passed', () => {
    it ('uses db name from env', async () => {
      await postgres.createDB()
      expect(spy).toHaveBeenCalledWith('CREATE DATABASE psychic_core_test')
    })
  })
})

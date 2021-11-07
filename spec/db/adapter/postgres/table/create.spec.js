import { jest } from '@jest/globals'
import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()
let spy

describe('PostgresAdapter.db#create', () => {
  beforeEach(() => {
    spy = jest
      .spyOn(postgres, 'runSQL')
      .mockImplementation(() => true)
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it ('creates a CreateTableStatement, passing instance which can have methods called on it for writing columns', async () => {
    await postgres.createTable('users', [
      { name: 'id', type: 'int', primary: true },
      { name: 'email', type: 'string' },
      { name: 'password', type: 'string' },
    ])

    expect(spy).toHaveBeenCalledWith(
`
CREATE TABLE users (
  id SERIAL PRIMARY KEY UNIQUE,
  email TEXT,
  password TEXT
)
`
    )
  })
})

import { jest } from '@jest/globals'
import Spawn from 'src/spawn'
import TestUser from 'dist/testapp/app/dreams/test-user'
import db from 'dist/db'
import config from 'dist/config'

describe ('Spawn#now', () => {
  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'test_users': TestUser,
    })
    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      test_users: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        email: {
          type: 'string',
          name: 'email',
        },
        password: {
          type: 'string',
          name: 'password',
        },
        passwordConfirm: {
          type: 'string',
          name: 'passwordConfirm',
        },
      },
    })

    await db.createTable('users', t => {
      t.string('email')
    })
    await db.createTable('favorite_ice_creams', t => {
      t.int('user_id')
      t.string('flavor')
    })
    await db.insert('users', { email: 'fishman' })
    await db.insert('favorite_ice_creams', { flavor: 'chocolate', user_id: 1 })
  })

  it ('passes to bree', () => {
    jest.spyOn(TestUser, 'find')
    const spawn = new Spawn()
    spawn.now('TestUser', 'find', [10])
  })
})


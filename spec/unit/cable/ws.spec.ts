import { describe as context } from '@jest/globals'
import { DateTime } from 'luxon'
import redisWsKey, * as RedisWsKeyModule from '../../../src/cable/redisWsKey'
import createWsRedisClient from '../../../src/cable/createWsRedisClient'
import Ws, { InvalidWsPathError } from '../../../src/cable/ws'
import User from '../../../test-app/app/models/User'

describe('Ws', () => {
  describe('.register', () => {
    beforeEach(async () => {
      const redisClient = await createWsRedisClient()
      await redisClient.del(`user:123:socket_ids`)
      await redisClient.del(`user:otheruserid:socket_ids`)
    })

    it('puts socket id in redis', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await Ws.register({ id: '456', on: jest.fn() } as any, '123')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await Ws.register({ id: '789', on: jest.fn() } as any, '123')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await Ws.register({ id: '101', on: jest.fn() } as any, 'otheruserid')

      const socketIds = await new Ws([]).findSocketIds('123')
      expect(socketIds).toEqual(['456', '789'])
    })

    context('with more than 3 register calls for the same user', () => {
      it('restricts to 3 per unique id', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        await Ws.register({ id: '456', on: jest.fn() } as any, '123')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        await Ws.register({ id: '789', on: jest.fn() } as any, '123')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        await Ws.register({ id: '345', on: jest.fn() } as any, '123')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        await Ws.register({ id: '234', on: jest.fn() } as any, '123')

        const socketIds = await new Ws([]).findSocketIds('123')
        expect(socketIds).toEqual(['789', '345', '234'])
      })
    })

    it('binds disconnect logic to socket', async () => {
      const onSpy = jest.fn()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await Ws.register({ id: '456', on: onSpy } as any, '123')

      // NOTE: would be better to get a solid test around disconnection behavior, but that would need to be
      // an end-to-end test.
      expect(onSpy).toHaveBeenCalledWith('disconnect', expect.any(Function))
    })

    it('calls emit to the passed id', async () => {
      const emitSpy = jest.spyOn(Ws.prototype, 'emit').mockImplementation(async () => {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await Ws.register({ id: '986', on: jest.fn() } as any, '987')

      expect(emitSpy).toHaveBeenCalledWith('987', '/ops/connection-success', {
        message: 'Successfully connected to psychic websockets',
      })
    })

    context('when passed a dream', () => {
      it('calls the primaryKeyValue of that dream instance', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const emitSpy = jest.spyOn(Ws.prototype, 'emit').mockImplementation(async () => {})
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        await Ws.register({ id: '986', on: jest.fn() } as any, user)

        expect(emitSpy).toHaveBeenCalledWith(user.id, '/ops/connection-success', {
          message: 'Successfully connected to psychic websockets',
        })
      })
    })
  })

  describe('#emit', () => {
    let ws: Ws<readonly string[]>
    let findSocketIdsSpy: jest.SpyInstance
    let toSpy: jest.SpyInstance
    let emitSpy: jest.SpyInstance

    async function buildWsInstanceForEmitTests(findSocketIdsValue: string[]) {
      ws = new Ws(['/ops/howyadoin'] as const)
      await ws.boot()

      findSocketIdsSpy = jest.spyOn(ws, 'findSocketIds').mockResolvedValue(findSocketIdsValue)
      emitSpy = jest.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      toSpy = jest.spyOn(ws.io, 'to').mockReturnValue({ emit: emitSpy } as any)
    }

    it('emits to the passed id to the default socket.io namespace, using "user" (by default) as the redis key prefix', async () => {
      await buildWsInstanceForEmitTests(['456'])

      await ws.emit(123, '/ops/howyadoin', { hello: 'world' })
      expect(findSocketIdsSpy).toHaveBeenCalledWith(123)
      expect(toSpy).toHaveBeenCalledWith('456')
      expect(emitSpy).toHaveBeenCalledWith('/ops/howyadoin', { hello: 'world' })
    })

    context('findSocketIds does not find any socket ids for the user', () => {
      it('does not emit to the passed id with the "user" namespace', async () => {
        await buildWsInstanceForEmitTests([])

        await ws.emit(123, '/ops/howyadoin', { hello: 'world' })
        expect(toSpy).not.toHaveBeenCalled()
        expect(emitSpy).not.toHaveBeenCalled()
      })
    })

    context('when passed a dream', () => {
      it('emits to the primaryKeyValue of that dream', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        await buildWsInstanceForEmitTests(['456'])

        await ws.emit(user, '/ops/howyadoin', { hello: 'world' })
        expect(toSpy).toHaveBeenCalledWith('456')
        expect(findSocketIdsSpy).toHaveBeenCalledWith(user.id)
        expect(emitSpy).toHaveBeenCalledWith('/ops/howyadoin', { hello: 'world' })
      })
    })

    context('when passed an invalid path', () => {
      it('raises an exception', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        await buildWsInstanceForEmitTests(['456'])

        await expect(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ws.emit(user, '/ops/whoopsthisiswrong' as any, { hello: 'world' })
        ).rejects.toThrowError(InvalidWsPathError)
      })
    })
  })

  describe('#findSocketIds', () => {
    let ws: Ws<[]>
    beforeEach(async () => {
      const redisClient = await createWsRedisClient()
      const key = redisWsKey('150', 'user')
      const otherKey = redisWsKey('160', 'howyadoin')

      await redisClient
        .multi()
        .rPush(key, ['151'])
        .expireAt(key, DateTime.now().plus({ seconds: 15 }).toJSDate())
        .exec()

      await redisClient
        .multi()
        .rPush(otherKey, ['161'])
        .expireAt(key, DateTime.now().plus({ seconds: 15 }).toJSDate())
        .exec()

      ws = new Ws([] as const)
      await ws.boot()
    })

    it('calls to redis to find socket ids', async () => {
      const redisWsKeySpy = jest.spyOn(RedisWsKeyModule, 'default')
      const socketIds = await ws.findSocketIds('150')
      expect(socketIds).toEqual(['151'])
      expect(redisWsKeySpy).toHaveBeenCalledWith('150', 'user')
    })

    context('with a custom redisKeyPrefix', () => {
      it('uses the custom prefix to generate the redis key', async () => {
        const redisWsKeySpy = jest.spyOn(RedisWsKeyModule, 'default')
        ws = new Ws([] as const, { redisKeyPrefix: 'howyadoin' })
        const socketIds = await ws.findSocketIds('160')
        expect(socketIds).toEqual(['161'])
        expect(redisWsKeySpy).toHaveBeenCalledWith('160', 'howyadoin')
      })
    })

    context('for a user with no registered socket ids', () => {
      it('returns a blank array', async () => {
        const socketIds = await ws.findSocketIds('123123123')
        expect(socketIds).toEqual([])
      })
    })
  })
})

import { DateTime } from 'luxon'
import { Dream, IdType, testEnv, uniq } from '@rvohealth/dream'
import { createClient } from 'redis'
import { Emitter } from '@socket.io/redis-emitter'
import createWsRedisClient from './createWsRedisClient'
import { Socket } from 'socket.io'
import redisWsKey from './redisWsKey'

export default class Ws<AllowedPaths extends readonly string[]> {
  public io: Emitter
  private redisClient: ReturnType<typeof createClient>
  private booted = false
  private namespace: string
  private redisKeyPrefix: string

  public static async register(socket: Socket, id: IdType | Dream, redisKeyPrefix: string = 'user') {
    const redisClient = await createWsRedisClient()
    const interpretedId = (id as Dream)?.isDreamInstance ? (id as Dream).primaryKeyValue : (id as IdType)
    const key = redisWsKey(interpretedId, redisKeyPrefix)

    const socketIdsToKeep = await redisClient.lRange(redisWsKey(interpretedId, redisKeyPrefix), -2, -1)

    await redisClient
      .multi()
      .del(key)
      .rPush(key, [...socketIdsToKeep, socket.id])
      .expireAt(
        key,
        // TODO: make this configurable in non-test environments
        DateTime.now()
          .plus(testEnv() ? { seconds: 15 } : { day: 1 })
          .toJSDate(),
      )
      .exec()

    socket.on('disconnect', async () => {
      await redisClient.lRem(key, 1, socket.id)
    })

    const ws = new Ws(['/ops/connection-success'] as const)
    await ws.emit(interpretedId, '/ops/connection-success', {
      message: 'Successfully connected to psychic websockets',
    })
  }

  constructor(
    public allowedPaths: AllowedPaths & readonly string[],
    {
      namespace = '/',
      redisKeyPrefix = 'user',
    }: {
      namespace?: string
      redisKeyPrefix?: string
    } = {},
  ) {
    this.namespace = namespace
    this.redisKeyPrefix = redisKeyPrefix
  }

  public async boot() {
    if (this.booted) return

    this.redisClient = await createWsRedisClient()
    this.io = new Emitter(this.redisClient).of(this.namespace)
    this.booted = true
  }

  public async emit<T extends Ws<AllowedPaths>, const P extends AllowedPaths[number]>(
    this: T,
    id: IdType | Dream,
    path: P,
    // eslint-disable-next-line
    data: any = {},
  ) {
    if (this.allowedPaths.length && !this.allowedPaths.includes(path)) throw new InvalidWsPathError(path)

    await this.boot()
    const socketIds = await this.findSocketIds(
      (id as Dream)?.isDreamInstance ? (id as Dream).primaryKeyValue : (id as IdType),
    )

    for (const socketId of socketIds) {
      this.io.to(socketId).emit(path, data)
    }
  }

  public async findSocketIds(id: IdType): Promise<string[]> {
    await this.boot()
    return uniq(await this.redisClient.lRange(this.redisKey(id), 0, -1))
  }

  private redisKey(userId: IdType) {
    return redisWsKey(userId, this.redisKeyPrefix)
  }
}

export class InvalidWsPathError extends Error {
  constructor(private invalidPath: string) {
    super()
  }

  public get message() {
    return `
      Invalid path passed to Ws: "${this.invalidPath}"
    `
  }
}

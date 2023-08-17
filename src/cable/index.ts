import * as colors from 'colorette'
import { Application } from 'express'
import { createClient, RedisClientOptions, RedisClientType } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import http from 'http'
import socketio from 'socket.io'
import log from '../log'
import redisOptions from '../config/helpers/redisOptions'
import readAppConfig from '../config/helpers/readAppConfig'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import { getPsychicHttpInstance } from '../server/helpers/startPsychicServer'

export default class Cable {
  public app: Application
  public io: socketio.Server | undefined
  public http: http.Server
  public useRedis: boolean
  constructor(app: Application) {
    this.app = app
  }

  public async connect() {
    if (this.io) return
    // for socket.io, we have to circumvent the normal process for starting a
    // psychic server so that we can bind socket.io to the http instance.
    this.http = getPsychicHttpInstance(this.app)

    // TODO: allow origin to be specified by a config
    this.io = new socketio.Server(this.http, { cors: { origin: '*' } })

    const appConfig = readAppConfig()
    if (!appConfig) throw `Failed to read app config`

    this.useRedis = appConfig.redis
  }

  public async start(
    port = process.env.PORT || 7777,
    {
      withReact = false,
      reactPort = 3000,
    }: {
      withReact?: boolean
      reactPort?: number
    } = {}
  ) {
    await this.connect()

    let startDef: (socket: socketio.Server) => Promise<void>
    try {
      startDef = await importFileWithDefault(absoluteSrcPath('conf/ws/start'))
      if (startDef) await startDef(this.io!)
    } catch (error) {}

    let connectDef: (socket: socketio.Socket) => Promise<void>
    try {
      connectDef = await importFileWithDefault(absoluteSrcPath('conf/ws/connect'))
    } catch (error) {}

    this.io!.on('connect', async socket => {
      log.puts('A user connected')

      if (connectDef) await connectDef(socket)

      socket.on('disconnect', function () {
        log.puts('A user disconnected')
      })
    })

    if (this.useRedis) await this.bindToRedis()

    await this.listen({ port, withReact, reactPort })
  }

  public async listen({
    port,
    withReact,
    reactPort,
  }: {
    port: number | string
    withReact: boolean
    reactPort: number
  }) {
    return new Promise(accept => {
      this.http.listen(port, async () => {
        log.welcome(port)

        await log.write('\n')
        await log.write(colors.cyan('socket server started                                      '))
        await log.write(
          colors.cyan(`psychic dev server started at port ${colors.bgBlueBright(colors.green(port))}`)
        )
        if (withReact) await log.write(`react server started at port ${colors.cyan(reactPort)}`)
        await log.write('\n')

        accept(true)
      })
    })
  }

  public async bindToRedis() {
    const redisOpts = await redisOptions('ws')
    const actualOpts = await redisOpts()
    const creds = {
      username: actualOpts.username,
      password: actualOpts.password,
      socket: {
        host: actualOpts.host,
        port: actualOpts.port ? parseInt(actualOpts.port) : 6379,
        tls: (!!actualOpts.secure || undefined) as true,
        rejectUnauthorized: !!actualOpts.secure,
      },
    } as RedisClientOptions

    const pubClient = createClient(creds)
    const subClient = pubClient.duplicate()

    pubClient.on('error', error => {
      console.log('PUB CLIENT ERROR', error)
    })
    subClient.on('error', error => {
      console.log('sub CLIENT ERROR', error)
    })

    try {
      await Promise.all([pubClient.connect(), subClient.connect()])
    } catch (error) {
      console.log('REDIS CONNECT ERROR: ', error)
    }

    try {
      this.io!.adapter(createAdapter(pubClient, subClient))
    } catch (error) {
      console.log('FAILED TO ADAPT', error)
    }
  }
}

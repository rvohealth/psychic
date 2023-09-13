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

    const getCorsOptions = await importFileWithDefault(absoluteSrcPath('conf/cors'))
    this.io = new socketio.Server(this.http, { cors: await getCorsOptions() })

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
      try {
        if (connectDef) await connectDef(socket)
      } catch (error) {
        if (process.env.PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS === '1') throw error
        else {
          console.error(`
            An exception was caught in your websocket thread.
            To prevent your server from crashing, we are rescuing this error here for you.
            If you would like us to raise this exception, make sure to set
  
            PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS=1
  
            the error received is:
  
            ${error}
          `)
          console.trace()
        }
      }
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

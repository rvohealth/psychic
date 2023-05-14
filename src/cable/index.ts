import * as colors from 'colorette'
import { Application } from 'express'
import { createClient, RedisClientType } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import http from 'http'
import socketio from 'socket.io'
import log from '../log'
import redisOptions from '../config/helpers/redisOptions'
import readAppConfig from '../config/helpers/readAppConfig'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'

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
    this.http = http.createServer(this.app)
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

    this.io!.on('connection', async socket => {
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
    const redisOpts = await redisOptions()
    const actualOpts = await redisOpts()
    const creds = { socket: { ...actualOpts, port: actualOpts.port || 6379 } }

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

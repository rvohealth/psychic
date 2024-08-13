import { testEnv } from '@rvohealth/dream'
import { createAdapter } from '@socket.io/redis-adapter'
import * as colors from 'colorette'
import { Application } from 'express'
import http from 'http'
import { createClient, RedisClientOptions } from 'redis'
import socketio from 'socket.io'
import log from '../log'
import PsychicApplication from '../psychic-application'
import { getPsychicHttpInstance } from '../server/helpers/startPsychicServer'
import { envBool } from '../helpers/envValue'

export default class Cable {
  public app: Application
  public io: socketio.Server | undefined
  public http: http.Server
  public useRedis: boolean
  private config: PsychicApplication
  constructor(app: Application, config: PsychicApplication) {
    this.app = app
    this.config = config
  }

  public connect() {
    if (this.io) return
    // for socket.io, we have to circumvent the normal process for starting a
    // psychic server so that we can bind socket.io to the http instance.
    this.http = getPsychicHttpInstance(this.app, this.config.sslCredentials)
    this.io = new socketio.Server(this.http, { cors: this.config.corsOptions })
    this.useRedis = this.config.useRedis
  }

  public async start(
    port = process.env.PORT || 7777,
    {
      withFrontEndClient = false,
      frontEndPort = 3000,
    }: {
      withFrontEndClient?: boolean
      frontEndPort?: number
    } = {},
  ) {
    this.connect()

    for (const hook of this.config.specialHooks.wsStart) {
      await hook(this.io!)
    }

    this.io!.on('connect', async socket => {
      try {
        for (const hook of this.config.specialHooks.wsConnect) {
          await hook(socket)
        }
      } catch (error) {
        if (envBool('PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS')) throw error
        else {
          console.error(`
            An exception was caught in your websocket thread.
            To prevent your server from crashing, we are rescuing this error here for you.
            If you would like us to raise this exception, make sure to set

            PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS=1

            the error received is:

            ${(error as Error).message}
          `)
          console.trace()
        }
      }
    })

    if (this.useRedis) await this.bindToRedis()

    await this.listen({ port: parseInt(port.toString()), withFrontEndClient, frontEndPort })
  }

  public async listen({
    port,
    withFrontEndClient,
    frontEndPort,
  }: {
    port: number | string
    withFrontEndClient: boolean
    frontEndPort: number
  }) {
    return new Promise(accept => {
      this.http.listen(port, () => {
        if (!testEnv()) {
          log.welcome()
          log.puts('\n')
          log.puts(colors.cyan('socket server started                                      '))
          log.puts(
            colors.cyan(`psychic dev server started at port ${colors.bgBlueBright(colors.green(port))}`),
          )
          if (withFrontEndClient) log.puts(`client server started at port ${colors.cyan(frontEndPort)}`)
          log.puts('\n')
        }

        accept(true)
      })
    })
  }

  public async bindToRedis() {
    const userRedisCreds = this.config.redisWsCredentials
    const creds = {
      username: userRedisCreds.username,
      password: userRedisCreds.password,
      socket: {
        host: userRedisCreds.host,
        port: userRedisCreds.port ? parseInt(userRedisCreds.port) : 6379,
        tls: (!!userRedisCreds.secure || undefined) as true,
        rejectUnauthorized: !!userRedisCreds.secure,
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

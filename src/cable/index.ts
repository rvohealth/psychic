import { testEnv } from '@rvohealth/dream'
import { createAdapter } from '@socket.io/redis-adapter'
import * as colors from 'colorette'
import { Application } from 'express'
import http from 'http'
import socketio from 'socket.io'
import { envBool } from '../helpers/envValue'
import log from '../log'
import PsychicApplication from '../psychic-application'
import { getPsychicHttpInstance } from '../server/helpers/startPsychicServer'

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
    port?: number,
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
          PsychicApplication.logWithLevel(
            'error',
            `
            An exception was caught in your websocket thread.
            To prevent your server from crashing, we are rescuing this error here for you.
            If you would like us to raise this exception, make sure to set

            PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS=1

            the error received is:

            ${(error as Error).message}
          `,
          )
          console.trace()
        }
      }
    })

    if (this.useRedis) this.bindToRedis()

    const psychicApp = PsychicApplication.getOrFail()
    await this.listen({
      port: parseInt((port || psychicApp.port).toString()),
      withFrontEndClient,
      frontEndPort,
    })
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

  public bindToRedis() {
    const pubClient = this.config.websocketOptions.connection
    const subClient = pubClient.duplicate()

    pubClient.on('error', error => {
      PsychicApplication.log('PUB CLIENT ERROR', error)
    })
    subClient.on('error', error => {
      PsychicApplication.log('sub CLIENT ERROR', error)
    })

    try {
      this.io!.adapter(createAdapter(pubClient, subClient))
    } catch (error) {
      PsychicApplication.log('FAILED TO ADAPT', error)
    }
  }
}

import { DreamCLI } from '@rvoh/dream/system'
import { Express } from 'express'
import * as fs from 'node:fs'
import * as http from 'node:http'
import { Server } from 'node:http'
import * as https from 'node:https'
import colorize from '../../cli/helpers/colorize.js'
import PsychicLogos from '../../cli/helpers/PsychicLogos.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import PsychicApp, { PsychicSslCredentials } from '../../psychic-app/index.js'

export interface StartPsychicServerOptions {
  app: Express
  port: number
  sslCredentials: PsychicSslCredentials | undefined
}

export default async function startPsychicServer({
  app,
  port,
  sslCredentials,
}: StartPsychicServerOptions): Promise<Server> {
  return await new Promise(accept => {
    const httpOrHttps = createPsychicHttpInstance(app, sslCredentials)
    const server = httpOrHttps.listen(port, () => {
      welcomeMessage({ port })
      accept(server)
    })
  })
}

export function createPsychicHttpInstance(app: Express, sslCredentials: PsychicSslCredentials | undefined) {
  if (sslCredentials?.key && sslCredentials?.cert) {
    return https.createServer(
      {
        key: fs.readFileSync(sslCredentials.key),
        cert: fs.readFileSync(sslCredentials.cert),
      },
      app as http.RequestListener<typeof http.IncomingMessage, typeof http.ServerResponse>,
    )
  } else {
    return http.createServer(
      app as http.RequestListener<typeof http.IncomingMessage, typeof http.ServerResponse>,
    )
  }
}

function welcomeMessage({ port }: { port: number }) {
  if (EnvInternal.isDevelopment) {
    DreamCLI.logger.log(colorize(PsychicLogos.asciiLogo(), { color: 'greenBright' }), {
      logPrefix: '',
    })
    DreamCLI.logger.log('', { logPrefix: '' })
    DreamCLI.logger.log(colorize('✺ ' + PsychicApp.getOrFail().appName, { color: 'greenBright' }), {
      logPrefix: '',
    })
    DreamCLI.logger.log(colorize(`└─ http://localhost:${port.toString()}`, { color: 'greenBright' }), {
      logPrefix: '',
    })
    DreamCLI.logger.log('', { logPrefix: '' })
  } else {
    DreamCLI.logger.log(`psychic dev server started at port ${port}`)
  }
}

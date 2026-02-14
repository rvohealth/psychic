import { DreamCLI } from '@rvoh/dream/system'
import Koa from 'koa'
import * as fs from 'node:fs'
import * as http from 'node:http'
import { Server } from 'node:http'
import * as https from 'node:https'
import colorize from '../../cli/helpers/colorize.js'
import PsychicLogos from '../../cli/helpers/PsychicLogos.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import PsychicApp, { PsychicSslCredentials } from '../../psychic-app/index.js'

export interface StartPsychicServerOptions {
  app: Koa
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

export function createPsychicHttpInstance(app: Koa, sslCredentials: PsychicSslCredentials | undefined) {
  const psychicApp = PsychicApp.getOrFail()
  const callback = app.callback()

  if (sslCredentials?.key && sslCredentials?.cert) {
    return https.createServer(
      {
        key: fs.readFileSync(sslCredentials.key),
        cert: fs.readFileSync(sslCredentials.cert),
        ca: sslCredentials.ca?.map(filePath => fs.readFileSync(filePath)),
        rejectUnauthorized: sslCredentials?.rejectUnauthorized,
        ...psychicApp.httpServerOptions,
      },
      callback,
    )
  } else {
    return http.createServer(psychicApp.httpServerOptions, callback)
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

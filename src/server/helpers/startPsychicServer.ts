import { DreamCLI } from '@rvoh/dream'
import { Express } from 'express'
import * as fs from 'node:fs'
import * as http from 'node:http'
import { Server } from 'node:http'
import * as https from 'node:https'
import EnvInternal from '../../helpers/EnvInternal.js'
import { PsychicSslCredentials } from '../../psychic-app/index.js'
import PsychicServer from '../../server/index.js'

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
  if (!EnvInternal.isTest) {
    DreamCLI.logger.log('starting psychic server...')
    DreamCLI.logger.log(PsychicServer.asciiLogo(), { logPrefix: '' })
    DreamCLI.logger.log(`psychic dev server started at port ${port}`)
  }
}

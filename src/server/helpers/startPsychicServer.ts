import { DreamCLI } from '@rvoh/dream'
import { Application } from 'express'
import * as fs from 'fs'
import * as http from 'http'
import { Server } from 'http'
import * as https from 'https'
import EnvInternal from '../../helpers/EnvInternal.js'
import { PsychicSslCredentials } from '../../psychic-application/index.js'
import PsychicServer from '../../server/index.js'

export interface StartPsychicServerOptions {
  app: Application
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

export function createPsychicHttpInstance(
  app: Application,
  sslCredentials: PsychicSslCredentials | undefined,
) {
  if (sslCredentials?.key && sslCredentials?.cert) {
    return https.createServer(
      {
        key: fs.readFileSync(sslCredentials.key),
        cert: fs.readFileSync(sslCredentials.cert),
      },
      app,
    )
  } else {
    return http.createServer(app)
  }
}

function welcomeMessage({ port }: { port: number }) {
  if (!EnvInternal.isTest) {
    DreamCLI.logger.log('starting psychic server...')
    DreamCLI.logger.log(PsychicServer.asciiLogo(), { logPrefix: '' })
    DreamCLI.logger.log(`psychic dev server started at port ${port}`)
  }
}

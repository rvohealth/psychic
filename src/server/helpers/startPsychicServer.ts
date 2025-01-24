import { Application } from 'express'
import fs from 'fs'
import http, { Server } from 'http'
import https from 'https'
import EnvInternal from '../../helpers/EnvInternal'
import log from '../../log'
import { PsychicSslCredentials } from '../../psychic-application'

export interface StartPsychicServerOptions {
  app: Application
  port: number
  withFrontEndClient: boolean
  frontEndPort: number
  sslCredentials: PsychicSslCredentials | undefined
}

export default async function startPsychicServer({
  app,
  port,
  withFrontEndClient,
  frontEndPort,
  sslCredentials,
}: StartPsychicServerOptions): Promise<Server> {
  return await new Promise(accept => {
    const httpOrHttps = createPsychicHttpInstance(app, sslCredentials)
    const server = httpOrHttps.listen(port, () => {
      welcomeMessage({ port, withFrontEndClient, frontEndPort })
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

function welcomeMessage({
  port,
  withFrontEndClient,
  frontEndPort,
}: {
  port: number
  withFrontEndClient: boolean
  frontEndPort: number
}) {
  if (!EnvInternal.isTest) {
    log.welcome()
    log.puts(`psychic dev server started at port ${port}`)
    if (withFrontEndClient) log.puts(`client dev server on port ${frontEndPort}`)
  }
}

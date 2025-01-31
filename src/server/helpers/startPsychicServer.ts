import { Application } from 'express'
import fs from 'fs'
import http, { Server } from 'http'
import https from 'https'
import EnvInternal from '../../helpers/EnvInternal'
import PsychicApplication, { PsychicSslCredentials } from '../../psychic-application'
import PsychicServer from '../../server'

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
    const psychicApp = PsychicApplication.getOrFail()
    psychicApp.logger.info(PsychicServer.asciiLogo())
    psychicApp.logger.info(`psychic dev server started at port ${port}`)
    if (withFrontEndClient) psychicApp.logger.info(`client dev server on port ${frontEndPort}`)
  }
}

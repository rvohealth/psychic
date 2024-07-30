import { testEnv } from '@rvohealth/dream'
import { Application } from 'express'
import fs from 'fs'
import http, { Server } from 'http'
import https from 'https'
import log from '../../log'
import { PsychicSslCredentials } from '../../psyconf'

export default async function startPsychicServer({
  app,
  port,
  withFrontEndClient,
  frontEndPort,
  sslCredentials,
}: {
  app: Application
  port: number
  withFrontEndClient: boolean
  frontEndPort: number
  sslCredentials: PsychicSslCredentials | undefined
}): Promise<Server> {
  return await new Promise(accept => {
    const httpOrHttps = getPsychicHttpInstance(app, sslCredentials)
    const server = httpOrHttps.listen(port, () => {
      welcomeMessage({ port, withFrontEndClient, frontEndPort })
      accept(server)
    })
  })
}

export function getPsychicHttpInstance(app: Application, sslCredentials: PsychicSslCredentials | undefined) {
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
  if (!testEnv()) {
    log.welcome()
    log.puts(`psychic dev server started at port ${port}`)
    if (withFrontEndClient) log.puts(`client dev server on port ${frontEndPort}`)
  }
}

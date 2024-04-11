import https from 'https'
import http from 'http'
import fs from 'fs'
import { Application } from 'express'
import log from '../../log'
import { Server } from 'http'

export default async function startPsychicServer({
  app,
  port,
  withFrontEndClient,
  frontEndPort,
}: {
  app: Application
  port: number
  withFrontEndClient: boolean
  frontEndPort: number
}): Promise<Server> {
  return await new Promise(accept => {
    const httpOrHttps = getPsychicHttpInstance(app)
    const server = httpOrHttps.listen(port, () => {
      welcomeMessage({ port, withFrontEndClient, frontEndPort })
      accept(server)
    })
  })
}

export function getPsychicHttpInstance(app: Application) {
  if (process.env.PSYCHIC_SSL_CERT_PATH && process.env.PSYCHIC_SSL_KEY_PATH) {
    return https.createServer(
      {
        key: fs.readFileSync(process.env.PSYCHIC_SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.PSYCHIC_SSL_CERT_PATH),
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
  if (process.env.NODE_ENV !== 'test') {
    log.welcome()
    log.puts(`psychic dev server started at port ${port}`)
    if (withFrontEndClient) log.puts(`client dev server on port ${frontEndPort}`)
  }
}

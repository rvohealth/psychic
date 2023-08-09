import https from 'https'
import http from 'http'
import fs from 'fs'
import { Application } from 'express'
import log from '../../log'
import { Server } from 'http'

export default async function startPsychicServer({
  app,
  port,
  withReact,
  reactPort,
}: {
  app: Application
  port: number
  withReact: boolean
  reactPort: number
}): Promise<Server> {
  return await new Promise(async accept => {
    const httpOrHttps = getPsychicHttpInstance(app)
    const server = httpOrHttps.listen(port, async () => {
      await welcomeMessage({ port, withReact, reactPort })
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
      app
    )
  } else {
    return http.createServer(app)
  }
}

async function welcomeMessage({
  port,
  withReact,
  reactPort,
}: {
  port: number
  withReact: boolean
  reactPort: number
}) {
  if (process.env.NODE_ENV !== 'test') {
    log.welcome(port)
    await log.write(`psychic dev server started at port ${port}`)
    if (withReact) await log.write(`react dev server on port ${reactPort}`)
  }
}

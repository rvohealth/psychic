import env from '../src/env'
import PsychicServer from '../src/server'

env.load()

const server = new PsychicServer()
server.start(parseInt(process.env.DEV_SERVER_PORT || '7778'))

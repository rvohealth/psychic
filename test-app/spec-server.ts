import './.psy/init'
import env from '../src/env'
import HowlServer from '../src/server'

env.load()

const server = new HowlServer()
server.start(parseInt(process.env.DEV_SERVER_PORT || '7778'))

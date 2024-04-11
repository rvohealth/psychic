import env from '../src/env'
import PsychicServer from '../src/server'

env.load()

const server = new PsychicServer()

void server.start()

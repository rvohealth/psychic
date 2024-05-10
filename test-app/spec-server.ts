import './conf/global'
import PsychicServer from '../src/server'

process.env.NODE_ENV = 'test'

const server = new PsychicServer()
void server.start(parseInt(process.env.DEV_SERVER_PORT || '7770'))

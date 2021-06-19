import { v4 as v4uuid } from 'uuid'
import fs from 'fs'
import moment from 'moment'
import crypto from 'crypto'
import dotenv from 'dotenv'
import spawn from 'src/singletons/spawn'
import config from 'src/config'
import loadYaml from 'src/helpers/load-yaml'

global.md5 = function(str) {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex')
}

global.now = function() {
  return moment()
}

global.uuid = function() {
  return v4uuid()
}

global.spawn = spawn
global.bg = (...args) => spawn.now(...args)
global.loadYaml = loadYaml
global.lookup = (...args) => config.lookup(...args)
global.ENV = process.env.CORE_TEST ? {} : dotenv.parse(fs.readFileSync('.env.development'))

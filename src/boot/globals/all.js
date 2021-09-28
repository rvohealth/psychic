import { v4 as v4uuid } from 'uuid'
import fs from 'fs'
import moment from 'moment'
import crypto from 'crypto'
import dotenv from 'dotenv'
import config from 'src/config'
import loadYaml from 'src/helpers/load-yaml'
import include from 'src/helpers/include'

function loadEnv() {
  if (process.env.CORE_TEST)
    return {
      ...dotenv.parse(fs.readFileSync('src/template/.env.test')),
      ...dotenv.parse(fs.readFileSync('.env')),
    }

  return dotenv.parse(fs.readFileSync('.env.development'))
}

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

global.include = include
global.loadYaml = loadYaml
global.lookup = (...args) => config.lookup(...args)

global.ENV = loadEnv()

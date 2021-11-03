import { v4 as v4uuid } from 'uuid'
import fs from 'fs'
import moment from 'moment'
import crypto from 'crypto'
import dotenv from 'dotenv'
import config from 'src/config'
import loadYaml from 'src/helpers/load-yaml'
import include from 'src/helpers/include'
import ghost from 'src/helpers/ghost'

function loadEnv() {
  console.log('ENV: ', process.env)
  if (process.env.CORE_INTEGRATION_BUT_USING_ROOT_PATH)
    if (fs.existsSync('tmp/integrationtestapp/.env.test'))
      return {
        ...dotenv.parse(fs.readFileSync('tmp/integrationtestapp/.env.test')),
      }
    else return '.env.test'

  if (process.env.CORE_INTEGRATION_TEST)
    return {
      ...dotenv.parse(fs.readFileSync('tmp/integrationtestapp/.env.test')),
    }

  if (process.env.CORE_TEST)
    return {
      ...dotenv.parse(fs.readFileSync('spec/support/testapp/.env.test')),
      ...dotenv.parse(fs.readFileSync('.env')),
    }

  if (process.env.NODE_ENV === 'test')
    return dotenv.parse(fs.readFileSync('.env.test'))

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

global.ghost = ghost
global.include = include
global.loadYaml = loadYaml
global.lookup = (...args) => config.lookup(...args)

global.ENV = loadEnv()

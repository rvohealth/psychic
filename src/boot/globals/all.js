import { v4 as v4uuid } from 'uuid'
import moment from 'moment'
import crypto from 'crypto'
import spawn from 'src/singletons/spawn'

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

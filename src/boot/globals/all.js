import { v4 as v4uuid } from 'uuid'
import moment from 'moment'

global.uuid = function() {
  return v4uuid()
}

global.now = function() {
  return moment()
}

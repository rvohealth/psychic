import { v4 as v4uuid } from 'uuid'

global.uuid = function() {
  return v4uuid()
}

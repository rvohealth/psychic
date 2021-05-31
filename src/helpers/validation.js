import moment from 'moment'
import { validate as validateUUID } from 'uuid'
import config from 'src/config'

export const validatePresence = function(tableName, attributeName, attribute) {
  const columnType = config.columnType(tableName, attributeName)
  switch(columnType) {
  case 'array':
    return Array.isArray(attribute)

  case 'boolean':
    return typeof attribute === 'boolean'

  case 'float':
  case 'int':
    return typeof attribute === 'number'

  case 'hstore':
  case 'json':
    return typeof attribute === 'object'

  case 'char':
  case 'varchar':
  case 'string':
    return typeof attribute === 'string' &&
      !!attribute.length

  case 'time':
    if (!attribute) return false
    return /\d{1,2}:\d{1,2}:\d{1,2}/.test(attribute)

  case 'date':
  case 'timestamp':
    if (!attribute) return false
    return moment(attribute).isValid()

  case 'uuid':
    return validateUUID(attribute)

  default:
    throw 'OTHER'
  }
}

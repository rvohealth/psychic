import { db as _db } from '@rvohealth/dream'
import envConf from '../conf/env'

export default function db(connectionType: Parameters<typeof _db>[0] = 'primary') {
  return _db(connectionType, envConf)
}

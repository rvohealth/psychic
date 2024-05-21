import { db as _db } from '@rvohealth/dream'
import dreamconf from '../conf/dreamconf'

export default function db(connectionType: Parameters<typeof _db>[0] = 'primary') {
  return _db(connectionType, dreamconf)
}

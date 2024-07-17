import { Dream, Dreamconf } from '@rvohealth/dream'
import dreamconf from '../../conf/dreamconf'
import { schema } from '../../db/schema'
import { DBClass } from '../../db/sync'

export default class ApplicationModel extends Dream {
  public get dreamconf(): Dreamconf<DBClass, typeof schema> {
    return dreamconf
  }
}

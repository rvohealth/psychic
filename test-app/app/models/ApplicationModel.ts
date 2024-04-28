import { Dream, Dreamconf } from '@rvohealth/dream'
import { DBClass } from '../../db/sync'
import { schema } from '../../db/schema'
import dreamconf from '../../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }

  public get dreamconf(): Dreamconf<DBClass, typeof schema> {
    return dreamconf
  }
}

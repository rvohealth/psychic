import { Dream, Dreamconf } from '@rvohealth/dream'
import { AllColumns, DBClass } from '../../db/sync'
import { schema } from '../../db/schema'
import dreamconf from '../../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }

  public get allColumns(): typeof AllColumns {
    return AllColumns as typeof AllColumns
  }

  public get dreamconf(): Dreamconf<DBClass, typeof schema> {
    return dreamconf
  }
}

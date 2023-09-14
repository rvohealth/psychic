import { Dream, Dreamconf } from 'dream'
import { DBClass } from '../../db/schema'
import SyncedAssociationsVal, { SyncedAssociations } from '../../db/associations'
import dreamconf from '../../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }

  public get syncedAssociations(): SyncedAssociations {
    return SyncedAssociationsVal as SyncedAssociations
  }

  public get dreamconf(): Dreamconf {
    return dreamconf
  }
}

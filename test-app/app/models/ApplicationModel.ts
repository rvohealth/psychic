import { AssociationDepths, Dream, Dreamconf } from '@rvohealth/dream'
import { DBClass, DBColumns, DBTypeCache, InterpretedDBClass } from '../../db/schema'
import SyncedAssociationsVal, {
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
} from '../../db/associations'
import dreamconf from '../../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }

  public get maxAssociationTypeDepth() {
    return AssociationDepths.EIGHT as const
  }

  public get syncedAssociations(): SyncedAssociations {
    return SyncedAssociationsVal as SyncedAssociations
  }

  public get dreamconf(): Dreamconf<
    DBClass,
    InterpretedDBClass,
    SyncedAssociations,
    SyncedBelongsToAssociations,
    typeof VirtualColumns,
    typeof DBColumns,
    typeof DBTypeCache
  > {
    return dreamconf
  }
}

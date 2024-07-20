import { Dream } from '@rvohealth/dream'
import envConf from '../../conf/env'
import { globalSchema, schema } from '../../db/schema'
import { DBClass } from '../../db/sync'

export default class ApplicationModel extends Dream {
  public DB: DBClass
  public get env() {
    return envConf
  }

  public get schema() {
    return schema
  }

  public get globalSchema() {
    return globalSchema
  }
}

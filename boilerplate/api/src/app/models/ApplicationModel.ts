import { Dream } from '@rvohealth/dream'
import envConf from '../../conf/env'
import { DBClass } from '../../db/sync'
import { globalSchema, schema } from '../../db/schema'

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

import { Dream } from '@rvohealth/dream'
import { globalSchema, schema } from '../../types/dream'
import { DBClass } from '../../types/db'

export default class ApplicationModel extends Dream {
  public DB: DBClass

  public get schema() {
    return schema
  }

  public get globalSchema() {
    return globalSchema
  }
}

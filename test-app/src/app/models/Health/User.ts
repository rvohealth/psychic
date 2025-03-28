import { DateTime } from '@rvoh/dream'
import ApplicationModel from '../ApplicationModel.js'

export default class HealthUser extends ApplicationModel {
  public override get table() {
    return 'health_users' as const
  }

  public id: number
  public email: string
  public hashedPassword: string
  public name: string
  public createdAt: DateTime
  public updatedAt: DateTime
}

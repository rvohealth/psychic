import { DateTime } from 'luxon'
import ApplicationModel from '../ApplicationModel'

export default class User extends ApplicationModel {
  public get table() {
    return 'health_users' as const
  }

  public id: number
  public email: string
  public hashedPassword: string
  public name: string
  public createdAt: DateTime
  public updatedAt: DateTime
}

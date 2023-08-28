import { DateTime } from 'luxon'
import { Dream } from 'dream'

export default class User extends Dream {
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

import { DateTime } from 'luxon'
import { Dream } from 'dream'

export default class User extends Dream {
  public get table() {
    return 'health_users' as const
  }

  public id: number
  public email: string
  public hashed_password: string
  public name: string
  public created_at: DateTime
  public updated_at: DateTime
}
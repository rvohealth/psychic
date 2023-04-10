import { Column, Validates, dream } from 'dream'

const Dream = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Validates('contains', '@')
  @Validates('presence')
  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Validates('length', { min: 4, max: 18 })
  @Column('string')
  public password: string

  @Column('datetime')
  public created_at: Date

  @Column('datetime')
  public updated_at: Date
}

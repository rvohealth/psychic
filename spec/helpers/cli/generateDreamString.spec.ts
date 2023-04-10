import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'

describe('howl generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a dream model with multiple string fields', async () => {
      const res = generateDreamContent('MealTypes', [], { useUUID: false })
      expect(res).toEqual(
        `\
import { DateTime } from 'luxon'
import { dream, Column } from 'dream'

const Dream = dream('meal_types')
export default class MealType extends Dream {
  @Column('integer')
  public id: number

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
      )
    })
  })

  context('when provided attributes', () => {
    context('with a string attribute', () => {
      it('generates a dream model with multiple string fields', async () => {
        const res = generateDreamContent('users', ['email:string', 'password_digest:string'], {
          useUUID: false,
        })
        expect(res).toEqual(
          `\
import { DateTime } from 'luxon'
import { dream, Column } from 'dream'

const Dream = dream('users')
export default class User extends Dream {
  @Column('integer')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public password_digest: string

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
        )
      })
    })

    context('with an integer attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = generateDreamContent('users', ['chalupa_count:integer'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_count', 'number', 'integer')
      })
    })

    context('with a float attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = generateDreamContent('users', ['chalupa_count:float'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_count', 'number', 'float')
      })
    })

    context('with a datetime attribute', () => {
      it('generates a dream model with a timestamp field', async () => {
        const res = generateDreamContent('users', ['chalupafied_at:datetime'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupafied_at', 'DateTime', 'datetime')
      })
    })

    context('with a timestamp attribute', () => {
      it('generates a dream model with a timestamp field', async () => {
        const res = generateDreamContent('users', ['chalupafied_at:timestamp'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupafied_at', 'DateTime', 'datetime')
      })
    })

    context('with a citext attribute', () => {
      it('generates a dream model with a citext field', async () => {
        const res = generateDreamContent('users', ['name:citext'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'name', 'string', 'citext')
      })
    })

    context('with a json attribute', () => {
      it('generates a dream model with a string field', async () => {
        const res = generateDreamContent('users', ['chalupa_data:json'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_data', 'string', 'json')
      })
    })

    context('with a jsonb attribute', () => {
      it('generates a dream model with a string field', async () => {
        const res = generateDreamContent('users', ['chalupa_data:jsonb'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_data', 'string', 'jsonb')
      })
    })

    context('relationships', () => {
      context('when provided with a belongs_to relationship', () => {
        it('generates a BelongsTo relationship in model', () => {
          const res = generateDreamContent('compositions', ['graph_node:belongs_to'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { dream, Column, BelongsTo } from 'dream'
import GraphNode from './graph-node'

const Dream = dream('compositions')
export default class Composition extends Dream {
  @Column('integer')
  public id: number

  @Column('integer')
  public graph_node_id: number

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
          )
        })

        it('can handle multiple associations without duplicate imports', () => {
          const res = generateDreamContent('compositions', ['user:belongs_to', 'chalupa:belongs_to'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { dream, Column, BelongsTo } from 'dream'
import User from './user'
import Chalupa from './chalupa'

const Dream = dream('compositions')
export default class Composition extends Dream {
  @Column('integer')
  public id: number

  @Column('integer')
  public user_id: number

  @BelongsTo(() => User)
  public user: User

  @Column('integer')
  public chalupa_id: number

  @BelongsTo(() => Chalupa)
  public chalupa: Chalupa

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
          )
        })
      })

      context('when provided with a has_one relationship', () => {
        it('generates a HasOne relationship in model', () => {
          const res = generateDreamContent('compositions', ['user:has_one'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { dream, Column, HasOne } from 'dream'
import User from './user'

const Dream = dream('compositions')
export default class Composition extends Dream {
  @Column('integer')
  public id: number

  @HasOne(() => User)
  public user: User

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
          )
        })
      })

      context('when provided with a has_many relationship', () => {
        it('generates a HasMany relationship in model', () => {
          const res = generateDreamContent('users', ['composition:has_many'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { dream, Column, HasMany } from 'dream'
import Composition from './composition'

const Dream = dream('users')
export default class User extends Dream {
  @Column('integer')
  public id: number

  @HasMany(() => Composition)
  public compositions: Composition[]

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
          )
        })
      })

      context('when provided with a relationship and using uuids', () => {
        it('generates a uuid id field for relations relationship in model', () => {
          const res = generateDreamContent('compositions', ['user:belongs_to'], {
            useUUID: true,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { dream, Column, BelongsTo } from 'dream'
import User from './user'

const Dream = dream('compositions')
export default class Composition extends Dream {
  @Column('uuid')
  public id: string

  @Column('uuid')
  public user_id: string

  @BelongsTo(() => User)
  public user: User

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
          )
        })
      })
    })
  })
})

function expectSingleColumnWithType(response: string, name: string, type: string, dbType: string = type) {
  expect(response).toEqual(
    `\
import { DateTime } from 'luxon'
import { dream, Column } from 'dream'

const Dream = dream('users')
export default class User extends Dream {
  @Column('integer')
  public id: number

  @Column('${dbType}')
  public ${name}: ${type}

  @Column('datetime')
  public created_at: DateTime

  @Column('datetime')
  public updated_at: DateTime
}\
`
  )
}

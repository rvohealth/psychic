import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('species_types_enum').asEnum(['cat', 'noncat']).execute()
  await db.schema.createType('pet_treats_enum').asEnum(['snick snowcks', 'efishy feesh']).execute()

  await db.schema
    .createTable('pets')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('name', 'varchar(255)')
    .addColumn('collar_count', 'bigint')
    .addColumn('collar_count_int', 'integer')
    .addColumn('collar_count_numeric', 'numeric')
    .addColumn('required_collar_count', 'bigint', col => col.notNull().defaultTo(0))
    .addColumn('required_collar_count_int', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('required_collar_count_numeric', 'numeric', col => col.notNull().defaultTo(0))
    .addColumn('likes_walks', 'boolean')
    .addColumn('likes_treats', 'boolean', col => col.notNull().defaultTo(true))
    .addColumn('species', sql`species_types_enum`)
    .addColumn('favorite_treats', sql`pet_treats_enum[]`)
    .addColumn('last_seen_at', 'timestamp')
    .addColumn('last_heard_at', 'timestamp', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pets').execute()
  await db.schema.dropType('species_types_enum').execute()
}

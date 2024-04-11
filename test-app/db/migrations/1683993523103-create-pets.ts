import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('species_types_enum').asEnum(['cat', 'noncat']).execute()

  await db.schema
    .createTable('pets')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('name', 'varchar(255)')
    .addColumn('species', sql`species_types_enum`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pets').execute()
  await db.schema.dropType('species_types_enum').execute()
}

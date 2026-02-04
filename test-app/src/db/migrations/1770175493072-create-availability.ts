import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('availabilities')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('start', 'time', col => col.notNull())
    .addColumn('end', 'time')
    .addColumn('times', sql`time[]`)
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('restrict').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema.createIndex('availabilities_user_id').on('availabilities').column('user_id').execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('availabilities_user_id').execute()
  await db.schema.dropTable('availabilities').execute()
}

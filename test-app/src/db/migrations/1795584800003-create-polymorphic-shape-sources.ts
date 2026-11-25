import { Kysely } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_shape_sources')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('target_id', 'bigint', col => col.notNull())
    .addColumn('target_type', 'varchar', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_shape_sources').execute()
}

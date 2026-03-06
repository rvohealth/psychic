import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('balloon_types_enum').asEnum(['BalloonLatex', 'BalloonMylar']).execute()
  await db.schema.createType('balloon_colors_enum').asEnum(['red', 'green', 'blue']).execute()

  await db.schema
    .createTable('balloons')
    .addColumn('type', sql`balloon_types_enum`, col => col.notNull())
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigserial', col => col.references('users.id').onDelete('cascade'))
    .addColumn('color', sql`balloon_colors_enum`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('balloons').execute()

  await db.schema.dropType('balloon_colors_enum').execute()
}

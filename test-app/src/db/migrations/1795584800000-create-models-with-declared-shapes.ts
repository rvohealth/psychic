import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('models_with_declared_shapes')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('nullable_object', 'jsonb')
    .addColumn('nullable_objects', sql`jsonb[]`)
    .addColumn('nullable_composition', 'json')
    .addColumn('patterned', 'jsonb')
    .addColumn('with_default', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('undeclared_required_jsonb', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('encrypted_integer_secret', 'text')
    .addColumn('encrypted_date_secret', 'text')
    .addColumn('encrypted_date_time_secret', 'text')
    .addColumn('encrypted_decimal_secret', 'text')
    .addColumn('encrypted_integer_array_secret', 'text')
    .addColumn('encrypted_nullable_decimal_secret', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('models_with_declared_shapes').execute()
}

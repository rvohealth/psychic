import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_shape_target_bs')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('plain_column', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('identical_shape', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('identical_element_shape', sql`jsonb[]`, col => col.notNull().defaultTo('{}'))
    .addColumn('nullable_on_b', 'jsonb')
    .addColumn('different_shape', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('array_on_b', sql`jsonb[]`, col => col.notNull().defaultTo('{}'))
    .addColumn('declared_only_on_a', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('encrypted_bare_secret', 'text', col => col.notNull())
    .addColumn('encrypted_integer_secret', 'text', col => col.notNull())
    .addColumn('encrypted_nullable_string_secret', 'text', col => col.notNull())
    .addColumn('encrypted_null_declared_on_a_secret', 'text')
    .addColumn('encrypted_explicit_null_on_b_secret', 'text', col => col.notNull())
    .addColumn('encrypted_object_form_null_on_a_secret', 'text', col => col.notNull())
    .addColumn('encrypted_mismatched_secret', 'text', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_shape_target_bs').execute()
}

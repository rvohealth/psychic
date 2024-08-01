import { createExtension } from '@rvohealth/dream'
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await createExtension('uuid-ossp', db)
  await createExtension('citext', db)

  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar')
    .addColumn('nicknames', sql`varchar[]`)
    .addColumn('required_nicknames', sql`varchar[]`, col => col.defaultTo('{}').notNull())
    .addColumn('email', 'varchar', col => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('birthdate', 'date')
    .addColumn('favorite_citext', sql`citext`)
    .addColumn('required_favorite_citext', sql`citext`, col => col.notNull().defaultTo('chalupas'))
    .addColumn('favorite_citexts', sql`citext[]`)
    .addColumn('required_favorite_citexts', sql`citext[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_uuids', sql`uuid[]`)
    .addColumn('required_favorite_uuids', sql`uuid[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_dates', sql`date[]`)
    .addColumn('required_favorite_dates', sql`date[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_datetimes', sql`timestamp[]`)
    .addColumn('required_favorite_datetimes', sql`timestamp[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_jsons', sql`json[]`)
    .addColumn('required_favorite_jsons', sql`json[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_jsonbs', sql`jsonb[]`)
    .addColumn('required_favorite_jsonbs', sql`jsonb[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_texts', sql`text[]`)
    .addColumn('required_favorite_texts', sql`text[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_numerics', sql`numeric[]`)
    .addColumn('required_favorite_numerics', sql`numeric[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_booleans', sql`boolean[]`)
    .addColumn('required_favorite_booleans', sql`boolean[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_bigint', sql`bigint`)
    .addColumn('required_favorite_bigint', sql`bigint`, col => col.defaultTo(0).notNull())
    .addColumn('favorite_bigints', sql`bigint[]`)
    .addColumn('required_favorite_bigints', sql`bigint[]`, col => col.defaultTo('{}').notNull())
    .addColumn('favorite_integers', sql`integer[]`)
    .addColumn('required_favorite_integers', sql`integer[]`, col => col.defaultTo('{}').notNull())
    .addColumn('created_on', 'date', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('optional_uuid', 'uuid', col => col.defaultTo(sql`uuid_generate_v4()`).unique())
    .addColumn('uuid', 'uuid', col =>
      col
        .notNull()
        .defaultTo(sql`uuid_generate_v4()`)
        .unique(),
    )
    .addColumn('bio', 'text', col => col.notNull().defaultTo('my bio'))
    .addColumn('jsonb_data', 'jsonb')
    .addColumn('required_jsonb_data', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('json_data', 'json')
    .addColumn('required_json_data', 'json', col => col.notNull().defaultTo('{}'))
    .addColumn('password_digest', 'varchar', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}

import { db } from '@rvohealth/dream'
import { sql } from 'kysely'

export default async function enumsAndTheirValues() {
  const { rows } = await sql<{ enumType: string; enumLabel: string }>`
SELECT pg_type.typname AS enum_type, pg_enum.enumlabel AS enum_label FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid;

`.execute(db('primary'))

  const rowData: Record<string, string[]> = {}
  rows.forEach(row => {
    rowData[row.enumType] ||= []
    rowData[row.enumType].push(row.enumLabel)
  })

  return rowData
}

import SchemaWriter from 'src/migrate/schema-writer'
import Dir from 'src/helpers/dir'

afterEach(async () => {
  await SchemaWriter.destroy()
  await Dir.rmIfExists('tmp/spec/psy')
  // await db.flush()
})


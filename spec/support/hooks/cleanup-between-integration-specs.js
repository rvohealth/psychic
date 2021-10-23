import Dir from 'src/helpers/dir'

afterEach(async () => {
  await Dir.rmIfExists('tmp/spec/psy')
  // await db.flush()
})


import File from 'src/helpers/file'
import Dir from 'src/helpers/dir'

beforeAll(async () => {
  if (! (await File.exists('tmp')))
    await Dir.mkdir('tmp')

  if (! (await File.exists('tmp/storage')))
    await Dir.mkdir('tmp/storage')

  if (! (await File.exists('tmp/storage/spec')))
    await Dir.mkdir('tmp/storage/spec')
})



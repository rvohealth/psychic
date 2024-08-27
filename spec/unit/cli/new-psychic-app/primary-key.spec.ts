import { describe as context } from '@jest/globals'
import newPsychicApp from '../../../../global-cli/helpers/newPsychicApp'
import { expectPrimaryKey, readHowyadoinFile, removeHowyadoinDir } from './helpers/assertion'

describe('newPsychicApp (primaryKey options)', () => {
  beforeEach(async () => {
    await removeHowyadoinDir()
  })

  afterEach(async () => {
    await removeHowyadoinDir()
  })

  context('primaryKey is set to bigserial', () => {
    it('sets primary_key_type to "bigserial" in .dream.yml', async () => {
      await newPsychicApp('howyadoin', ['--redis', '--ws', '--client', 'react', '--primaryKey', 'bigserial'])

      const dreamtsContent = await readHowyadoinFile('api/src/conf/dream.ts')
      expectPrimaryKey('bigserial', dreamtsContent)
    })
  })

  context('primaryKey is set to uuid', () => {
    it('sets primary_key_type to "uuid" in .dream.yml', async () => {
      await newPsychicApp('howyadoin', [
        '--redis',
        'false',
        '--ws',

        '--client',
        'react',

        '--primaryKey',
        'uuid',
      ])

      const dreamtsContent = await readHowyadoinFile('api/src/conf/dream.ts')
      expectPrimaryKey('uuid', dreamtsContent)
    })
  })

  context('primaryKey is set to bigint', () => {
    it('sets primary_key_type to "bigint" in .dream.yml', async () => {
      await newPsychicApp('howyadoin', [
        '--redis',
        'false',
        '--ws',

        '--client',
        'react',

        '--primaryKey',
        'bigint',
      ])

      const dreamtsContent = await readHowyadoinFile('api/src/conf/dream.ts')
      expectPrimaryKey('bigint', dreamtsContent)
    })
  })

  context('primaryKey is set to integer', () => {
    it('sets primary_key_type to "integer" in .dream.yml', async () => {
      await newPsychicApp('howyadoin', [
        '--redis',
        'false',
        '--ws',

        '--client',
        'react',

        '--primaryKey',
        'integer',
      ])

      const dreamtsContent = await readHowyadoinFile('api/src/conf/dream.ts')
      expectPrimaryKey('integer', dreamtsContent)
    })
  })
})

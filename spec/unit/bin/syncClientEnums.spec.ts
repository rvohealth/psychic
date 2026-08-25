import * as fs from 'node:fs/promises'
import PsychicBin from '../../../src/bin/index.js'
import { UnregisteredOpenapiNameError } from '../../../src/cli/helpers/validateOpenapiName.js'

describe('PsychicBin.syncClientEnums', () => {
  const outfileDir = './spec/tmp/syncClientEnums'
  const outfile = `${outfileDir}/enums.ts`
  const otherOutfile = `${outfileDir}/other-enums.ts`

  beforeEach(async () => {
    await fs.rm(outfileDir, { recursive: true, force: true })
  })

  afterEach(async () => {
    await fs.rm(outfileDir, { recursive: true, force: true })
  })

  it('writes the enums appearing in the default OpenAPI spec when no openapiName is provided', async () => {
    await PsychicBin.syncClientEnums(outfile)

    const contents = (await fs.readFile(outfile)).toString()
    expect(contents).toEqual(
      expect.stringContaining(`\
export const SpeciesTypesEnumValues = [
  'cat',
  'noncat'
] as const`),
    )
    expect(contents).toEqual(expect.stringContaining('export const BalloonColorsEnumValues = ['))
  })

  it('scopes the written enums to the provided openapiName', async () => {
    await PsychicBin.syncClientEnums(outfile, 'internal')

    const contents = (await fs.readFile(outfile)).toString()
    // the internal spec renders species_types_enum only through a serializer
    // override subsetting it to ['cat']
    expect(contents).toEqual(
      expect.stringContaining(`\
export const SpeciesTypesEnumValues = [
  'cat'
] as const`),
    )
    expect(contents).not.toEqual(expect.stringContaining('noncat'))
  })

  it('keeps sequential syncs of different specs in one process isolated per outfile', async () => {
    await PsychicBin.syncClientEnums(outfile, 'internal')
    await PsychicBin.syncClientEnums(otherOutfile, 'enumTest')

    const internalContents = (await fs.readFile(outfile)).toString()
    const enumTestContents = (await fs.readFile(otherOutfile)).toString()

    expect(internalContents).not.toEqual(expect.stringContaining('noncat'))
    expect(enumTestContents).toEqual(expect.stringContaining("'noncat'"))
    // pet_treats_enum appears in the internal spec but not in the enumTest spec
    expect(internalContents).toEqual(expect.stringContaining('PetTreatsEnumValues'))
    expect(enumTestContents).not.toEqual(expect.stringContaining('PetTreatsEnumValues'))
  })

  context('with an unregistered openapiName', () => {
    it('throws a descriptive error listing the registered spec names', async () => {
      await expect(PsychicBin.syncClientEnums(outfile, 'not-a-registered-spec')).rejects.toThrow(
        UnregisteredOpenapiNameError,
      )

      await expect(PsychicBin.syncClientEnums(outfile, 'not-a-registered-spec')).rejects.toThrow(
        /default[\s\S]*mobile[\s\S]*internal[\s\S]*enumTest/,
      )
    })

    it('leaves an existing outfile untouched', async () => {
      await fs.mkdir(outfileDir, { recursive: true })
      await fs.writeFile(outfile, 'pre-existing contents')

      await expect(PsychicBin.syncClientEnums(outfile, 'not-a-registered-spec')).rejects.toThrow(
        UnregisteredOpenapiNameError,
      )

      expect((await fs.readFile(outfile)).toString()).toEqual('pre-existing contents')
    })
  })
})

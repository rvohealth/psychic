import enumsFileStr from '../../../../src/bin/helpers/enumsFileStr.js'
import {
  BalloonColorsEnumValues,
  PetTreatsEnumValues,
  SpeciesTypesEnumValues,
} from '../../../../test-app/src/types/db.js'

describe('enumFileStr', () => {
  context('the default spec', () => {
    it('alphabetically sorts enums and their values, emitting a const and a derived type per enum', () => {
      expect(enumsFileStr()).toEqual(
        expect.stringContaining(`\
"
  Dear pathetic humans,

  Here is a haiku to keep you in line

  don't dare go mucking
  with my files, I lyke them fine
  prettierignore
"

*/
export const BalloonColorsEnumValues = [
  'blue',
  'green',
  'red'
] as const
export type BalloonColorsEnumValues = (typeof BalloonColorsEnumValues)[number]\
`),
      )
    })

    it('only exports enums that appear in the selected OpenAPI spec surface', () => {
      // balloon_types_enum exists in the database, but no site in the default
      // spec renders it, so it is not exported
      expect(enumsFileStr()).not.toEqual(expect.stringContaining('BalloonTypesEnumValues'))
    })

    it('never includes null in an exported const, even for nullable enum columns', () => {
      // balloon_colors_enum and species_types_enum back nullable columns, and
      // their rendered spec shapes are null-augmented; the export must not be
      expect(enumsFileStr()).not.toEqual(expect.stringContaining("'null'"))
    })
  })

  context('a spec other than the default', () => {
    it('exports enums reachable only via a model-derived request body', () => {
      // pet_treats_enum's only internal-spec site is the model-derived request
      // body on InternalEnumSyncTestsController#treatRequestBody. Request
      // bodies have no override channel, so the full pg value set is exported.
      expect(enumsFileStr('internal')).toEqual(
        expect.stringContaining(`\
export const PetTreatsEnumValues = [
  'efishy feesh',
  'snick snowcks'
] as const
export type PetTreatsEnumValues = (typeof PetTreatsEnumValues)[number]`),
      )
    })

    it('exports enums reachable only via a nested `for:` sentinel inside `combining`', () => {
      // balloon_colors_enum's only internal-spec site is the nested
      // `for: Balloon` sentinel inside `combining` on
      // InternalEnumSyncTestsController#nestedForCombining
      expect(enumsFileStr('internal')).toEqual(
        expect.stringContaining(`\
export const BalloonColorsEnumValues = [
  'blue',
  'green',
  'red'
] as const`),
      )
    })

    context('serializer enum: overrides', () => {
      it('exports only the override subset when the enum has no other site in the selected spec', () => {
        // species_types_enum's only internal-spec site is
        // PetSpeciesSubsetSerializer's `enum: ['cat']` override
        expect(enumsFileStr('internal')).toEqual(
          expect.stringContaining(`\
export const SpeciesTypesEnumValues = [
  'cat'
] as const`),
        )
      })

      it('never emits a value hidden by the override anywhere in the file', () => {
        expect(enumsFileStr('internal')).not.toEqual(expect.stringContaining('noncat'))
      })

      it('unions the subsets when the same enum is overridden differently at two sites in one spec', () => {
        // the enumTest spec renders balloon_colors_enum at two serializer
        // sites, overridden to ['blue'] and ['green'] respectively
        const fileStr = enumsFileStr('enumTest')

        expect(fileStr).toEqual(
          expect.stringContaining(`\
export const BalloonColorsEnumValues = [
  'blue',
  'green'
] as const`),
        )
        expect(fileStr).not.toEqual(expect.stringContaining("'red'"))
      })

      it('exports the full value set when the enum also reaches the spec through a request body', () => {
        // in the enumTest spec, species_types_enum appears via
        // PetSpeciesSubsetSerializer's `enum: ['cat']` override AND via a
        // model-derived request body; request bodies have no override
        // channel, so the union is the full pg value set
        expect(enumsFileStr('enumTest')).toEqual(
          expect.stringContaining(`\
export const SpeciesTypesEnumValues = [
  'cat',
  'noncat'
] as const`),
        )
      })

      it('honors an items-level override subset on an array enum column', () => {
        // pet_treats_enum's only mobile-spec site is
        // PetTreatsItemsSubsetSerializer, whose override carries its enum at
        // items.enum; a collector falling back to the column's full value set
        // (because the top-level `enum` key is absent) would fail this
        const fileStr = enumsFileStr('mobile')

        expect(fileStr).toEqual(
          expect.stringContaining(`\
export const PetTreatsEnumValues = [
  'snick snowcks'
] as const`),
        )
        expect(fileStr).not.toEqual(expect.stringContaining('efishy feesh'))
      })
    })

    it('strips [] from array column db types when naming the export', () => {
      // pet_treats_enum reaches the mobile spec only through the
      // `pet_treats_enum[]` column Pet#favoriteTreats
      const fileStr = enumsFileStr('mobile')
      const exportedNames = [...fileStr.matchAll(/export const (\S+) = \[/g)].map(match => match[1])

      expect(exportedNames).toContain('PetTreatsEnumValues')
      exportedNames.forEach(name => expect(name).toMatch(/^[A-Za-z]+$/))
    })

    it('collects nothing from a column shadowed by a same-key `combining` entry', () => {
      // species_types_enum's only mobile-spec site is a request body whose
      // `species` param is replaced by a same-key `combining` entry, so the
      // rendered spec never shows the enum and nothing may be exported
      expect(enumsFileStr('mobile')).not.toEqual(expect.stringContaining('SpeciesTypesEnumValues'))
    })

    it('does not export an enum whose only sites are in other specs', () => {
      // pet_treats_enum appears in the default, internal, and mobile specs,
      // but no enumTest-spec site renders it
      expect(enumsFileStr('enumTest')).not.toEqual(expect.stringContaining('PetTreatsEnumValues'))
    })

    it('skips hand-written enums with no pg type name behind them', () => {
      // HandWrittenEnumSerializer renders a custom attribute with a
      // hand-written enum; there is no pg name to export it under
      const fileStr = enumsFileStr('mobile')

      expect(fileStr).not.toEqual(expect.stringContaining('zonked_out_on_catnip'))
      expect(fileStr).not.toEqual(expect.stringContaining('chilling_on_the_windowsill'))
    })

    context('a spec with suppressResponseEnums: true', () => {
      it('still exports the real values of an enum reachable only via a response', () => {
        // the mobile spec suppresses response enums (rendering them as
        // description text), and balloon_colors_enum's only mobile-spec site
        // is a response serializer — a collection hook placed downstream of
        // suppression would see no enum at all and fail this
        expect(enumsFileStr('mobile')).toEqual(
          expect.stringContaining(`\
export const BalloonColorsEnumValues = [
  'blue',
  'green',
  'red'
] as const`),
        )
      })
    })
  })

  context('sequential renders of different specs in one process', () => {
    it('keeps each spec isolated, with no cross-run bleed', () => {
      const internalBefore = enumsFileStr('internal')

      // the enumTest spec exports the full species_types_enum value set;
      // rendering it in between must not leak values into the internal spec's
      // subset export
      expect(enumsFileStr('enumTest')).toEqual(expect.stringContaining("'noncat'"))

      const internalAfter = enumsFileStr('internal')
      expect(internalAfter).toEqual(internalBefore)
      expect(internalAfter).not.toEqual(expect.stringContaining('noncat'))
    })
  })

  it('does not mutate the shared in-memory Dream schema enum arrays', () => {
    const speciesBefore = JSON.stringify(SpeciesTypesEnumValues)
    const treatsBefore = JSON.stringify(PetTreatsEnumValues)
    const colorsBefore = JSON.stringify(BalloonColorsEnumValues)

    enumsFileStr()
    enumsFileStr('internal')
    enumsFileStr('mobile')
    enumsFileStr('enumTest')

    expect(JSON.stringify(SpeciesTypesEnumValues)).toEqual(speciesBefore)
    expect(JSON.stringify(PetTreatsEnumValues)).toEqual(treatsBefore)
    expect(JSON.stringify(BalloonColorsEnumValues)).toEqual(colorsBefore)
  })

  it('derives enums synchronously from the in-memory render, leaving no room for a database roundtrip', () => {
    // every database driver call in this stack is async; a synchronous string
    // return proves the enum derivation itself cannot have touched the db
    const result: unknown = enumsFileStr()
    expect(typeof result).toEqual('string')
  })
})

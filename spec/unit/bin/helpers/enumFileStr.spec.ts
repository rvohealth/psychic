import enumsFileStr from '../../../../src/bin/helpers/enumsFileStr.js'

describe('enumFileStr', () => {
  it('alphabetically sorts enums', () => {
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
})

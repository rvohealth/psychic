import enumsFileStr from '../../../../src/bin/helpers/enumsFileStr.js'

describe('enumFileStr', () => {
  it('alphabetically sorts enums', async () => {
    console.log(await enumsFileStr())
    expect(await enumsFileStr()).toEqual(
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
})

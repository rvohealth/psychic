import pascalizeFileName from '../../helpers/pascalizeFileName'
import enumsAndTheirValues from './enumsAndTheirValues'

export default async function enumsFileStr() {
  const enums = await enumsAndTheirValues()

  let enumsFileStr = ''

  Object.keys(enums).forEach(enumName => {
    const exportedTypeName = pascalizeFileName(enumName) + 'Values'
    const values = enums[enumName]

    enumsFileStr += `\
export const ${exportedTypeName} = [
  ${values.map(val => `'${val}'`).join(',\n  ')}
] as const

`
  })

  return enumsFileStr
}

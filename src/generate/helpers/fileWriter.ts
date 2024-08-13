import { compact, pascalize } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import pluralize from 'pluralize'
import { envBool } from '../../helpers/envValue'
import pascalizeFileName from '../../helpers/pascalizeFileName'

export default async function fileWriter(
  filePath: string,
  filePostfix: 'Controller' | 'Serializer',
  fileExtension: '.ts' | '.spec.ts',
  pluralizeBeforePostfix: boolean,
  directoryPrefix: 'app/controllers' | 'app/serializers' | 'spec/unit/controllers' | 'spec/unit/serializers',
  rootPath: string | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentFunction: (...args: any[]) => Promise<string> | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentFunctionAttrs: any[] = [],
) {
  const srcPath = fileExtension === '.spec.ts' ? '' : envBool('PSYCHIC_CORE_DEVELOPMENT') ? null : 'src'
  const newfileBasePath = path.join(...compact([rootPath, srcPath, directoryPrefix]))
  const fullyQualifiedNewfileClassName = pluralizeBeforePostfix
    ? `${pluralize(filePath)}${filePostfix}`
    : `${filePath}${filePostfix}`
  const newfileClassName = pascalizeFileName(fullyQualifiedNewfileClassName)
  const filepathRelativeToTypeRoot = fullyQualifiedNewfileClassName
    .split('/')
    .map(str => pascalize(str))
    .join('/')
  const dirPartsRelativeToTypeRoot = filepathRelativeToTypeRoot.split('/').slice(0, -1)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const newfileFileContents = await contentFunction(newfileClassName, ...contentFunctionAttrs)

  // if they are generating a nested newfile path,
  // we need to make sure the nested directories exist
  if (dirPartsRelativeToTypeRoot.length) {
    const fullDirectoryPath = [...newfileBasePath.split('/'), ...dirPartsRelativeToTypeRoot].join('/')
    await fs.mkdir(fullDirectoryPath, { recursive: true })
  }

  const fullNewfilePath = `${newfileBasePath}/${filepathRelativeToTypeRoot}${fileExtension}`
  const rootRelativeNewfilePath = fullNewfilePath.replace(
    new RegExp(`^.*${directoryPrefix}`),
    directoryPrefix,
  )

  console.log(
    `generating ${filePostfix.toLowerCase()}${
      fileExtension === '.spec.ts' ? ' spec' : ''
    }: ${rootRelativeNewfilePath}`,
  )
  await fs.writeFile(fullNewfilePath, newfileFileContents)
}

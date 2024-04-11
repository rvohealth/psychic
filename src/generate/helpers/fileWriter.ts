import pluralize from 'pluralize'
import fs from 'fs/promises'
import { pascalize, compact } from '@rvohealth/dream'
import path from 'path'

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
  const thisfs = fs ? fs : await import('fs/promises')
  const srcPath =
    fileExtension === '.spec.ts' ? '' : process.env.PSYCHIC_CORE_DEVELOPMENT === '1' ? null : 'src'
  const newfileBasePath = path.join(...compact([rootPath, srcPath, directoryPrefix]))
  const fullyQualifiedNewfileClassName = pluralizeBeforePostfix
    ? `${pluralize(filePath)}${filePostfix}`
    : `${filePath}${filePostfix}`
  const newfileClassName = pascalize(fullyQualifiedNewfileClassName)
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
    await thisfs.mkdir(fullDirectoryPath, { recursive: true })
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
  await thisfs.writeFile(fullNewfilePath, newfileFileContents)
}

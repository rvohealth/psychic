import pluralize from 'pluralize'
import fs from 'fs/promises'
import { pascalize } from 'dream'

export default async function fileWriter(
  filePath: string,
  filePostfix: 'Serializer',
  fileExtension: '.ts' | '.spec.ts',
  pluralizeBeforePostfix: boolean,
  contentFunction: (...args: any[]) => Promise<string> | string,
  rootPath: string,
  contentFunctionAttrs?: any[]
) {
  const thisfs = fs ? fs : await import('fs/promises')
  const srcPath = process.env.DREAM_CORE_DEVELOPMENT === '1' ? 'test-app' : 'src'
  const fullyQualifiedNewfileClassName = pluralizeBeforePostfix
    ? `${pluralize(filePath)}${filePostfix}`
    : `${filePath}${filePostfix}`
  const newfileClassName = pascalize(fullyQualifiedNewfileClassName)
  const filepathRelativeToTypeRoot = fullyQualifiedNewfileClassName
    .split('/')
    .map(str => pascalize(str))
    .join('/')
  const dirPartsRelativeToTypeRoot = filepathRelativeToTypeRoot.split('/').slice(0, -1)
  const newfileFileContents = await contentFunction(newfileClassName, ...(contentFunctionAttrs || []))

  // if they are generating a nested newfile path,
  // we need to make sure the nested directories exist
  if (!!dirPartsRelativeToTypeRoot.length) {
    const fullDirectoryPath = [...rootPath.split('/'), ...dirPartsRelativeToTypeRoot].join('/')
    await thisfs.mkdir(fullDirectoryPath, { recursive: true })
  }

  const fullNewfilePath = `${rootPath}/${filepathRelativeToTypeRoot}${fileExtension}`
  const rootRelativeNewfilePath = fullNewfilePath.replace(new RegExp(`^.*${rootPath}`), rootPath)
  console.log(`generating ${filePostfix.toLowerCase()}: ${rootRelativeNewfilePath}`)
  await thisfs.writeFile(fullNewfilePath, newfileFileContents)
}

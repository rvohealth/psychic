import * as pluralize from 'pluralize'
import * as fs from 'fs/promises'
import pascalize from '../../helpers/pascalize'

export default async function fileWriter(
  filePath: string,
  filePostfix: 'Controller' | 'Serializer',
  fileExtension: '.ts' | '.spec.ts',
  directoryPrefix: 'app/controllers' | 'app/serializers' | 'spec/unit/controllers' | 'spec/unit/serializers',
  rootPath: string | null = null,
  contentFunction: (...args: any[]) => Promise<string> | string,
  contentFunctionAttrs: any[] = []
) {
  const thisfs = fs ? fs : await import('fs/promises')
  const srcPath = process.env.CORE_DEVELOPMENT === '1' ? 'test-app' : 'src'
  const newfileBasePath = `${rootPath}/${srcPath}/${directoryPrefix}`
  const fullyQualifiedNewfileClassName = `${pluralize(filePath)}${filePostfix}`
  const newfileClassName = pascalize(fullyQualifiedNewfileClassName)
  const filepathRelativeToTypeRoot = fullyQualifiedNewfileClassName
    .split('/')
    .map(str => pascalize(str))
    .join('/')
  const dirPartsRelativeToTypeRoot = filepathRelativeToTypeRoot.split('/').slice(0, -1)
  const newfileFileContents = await contentFunction(newfileClassName, ...contentFunctionAttrs)

  // if they are generating a nested newfile path,
  // we need to make sure the nested directories exist
  if (!!dirPartsRelativeToTypeRoot.length) {
    const fullDirectoryPath = [...newfileBasePath.split('/'), ...dirPartsRelativeToTypeRoot].join('/')
    await thisfs.mkdir(fullDirectoryPath, { recursive: true })
  }

  const fullNewfilePath = `${newfileBasePath}/${filepathRelativeToTypeRoot}${fileExtension}`
  const rootRelativeNewfilePath = fullNewfilePath.replace(
    new RegExp(`^.*${directoryPrefix}`),
    directoryPrefix
  )
  console.log(`generating ${filePostfix.toLowerCase()}: ${rootRelativeNewfilePath}`)
  await thisfs.writeFile(fullNewfilePath, newfileFileContents)
}

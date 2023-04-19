import * as pluralize from 'pluralize'
import * as fs from 'fs/promises'
import generateSerializerString from './helpers/generateSerializerString'
import hyphenize from '../helpers/hyphenize'

export default async function generateSerializer(
  serializerName: string,
  attributes: string[],
  {
    rootPath = process.cwd(),
    allowExit = true,
  }: {
    rootPath?: string
    allowExit?: boolean
  } = {}
) {
  const thisfs = fs ? fs : await import('fs/promises')

  const serializerString = await generateSerializerString(pluralize(serializerName), attributes)
  const serializerBasePath = `${rootPath}/src/app/serializers`
  const serializerFilename = `${hyphenize(pluralize(serializerName))}`
  const serializerPathParts = serializerName.split('/')

  try {
    await thisfs.mkdir(serializerBasePath)
  } catch (e) {}

  // we don't need this value, just doing it so we can discard the file name and
  // thus only have the filepath left. This helps us handle a case where one wants
  // to generate a nested serializer, like so:
  //    psy g:serializer api/v1/users
  const serializerActualFilename = serializerPathParts.pop()

  const serializerPath = `${serializerBasePath}/${serializerFilename}.ts`
  console.log(`generating serializer: ${serializerPath}`)

  // if they are generating a nested serializer path,
  // we need to make sure the nested directories exist
  if (!!serializerPathParts.length) {
    const fullPath = [...serializerBasePath.split('/'), ...serializerPathParts].join('/')
    await thisfs.mkdir(fullPath, { recursive: true })
  }

  await thisfs.writeFile(serializerPath, serializerString)

  if (process.env.NODE_ENV !== 'test' && allowExit) {
    console.log('done!')
    process.exit()
  }
}

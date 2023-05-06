import generateSerializerString from './helpers/generateSerializerString'
import fileWriter from './helpers/fileWriter'

export default async function generateSerializer(
  serializerName: string,
  attributes: string[],
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
    allowExit = true,
  }: {
    rootPath?: string
    allowExit?: boolean
  } = {}
) {
  await fileWriter(
    serializerName,
    'Serializer',
    '.ts',
    'app/serializers',
    rootPath,
    generateSerializerString,
    [attributes]
  )

  console.log('done generating serializer')
}

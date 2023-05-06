import generateSerializerString from './helpers/generateSerializerString'
import fileWriter from './helpers/fileWriter'

export default async function generateSerializer(
  fullyQualifiedModelName: string,
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
    fullyQualifiedModelName,
    'Serializer',
    '.ts',
    'app/serializers',
    rootPath,
    generateSerializerString,
    [fullyQualifiedModelName, attributes]
  )

  console.log('done generating serializer')
}

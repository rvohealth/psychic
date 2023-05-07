import generateSerializerString from './helpers/generateSerializerString'
import fileWriter from './helpers/fileWriter'
import absoluteFilePath from '../helpers/absoluteFilePath'

export default async function generateSerializer(
  fullyQualifiedModelName: string,
  attributes: string[],
  {
    rootPath = absoluteFilePath(''),
  }: {
    rootPath?: string
  } = {}
) {
  await fileWriter(
    fullyQualifiedModelName,
    'Serializer',
    '.ts',
    false,
    'app/serializers',
    rootPath,
    generateSerializerString,
    [fullyQualifiedModelName, attributes]
  )

  console.log('done generating serializer')
}

import * as pluralize from 'pluralize'
import generateController from './controller'
import generateSerializer from './serializer'
import sspawn from '../helpers/sspawn'

export default async function generateResource(
  route: string,
  fullyQualifiedModelName: string,
  args: string[],
  {
    rootPath = process.env.PSYCHIC_CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
  }: {
    rootPath?: string
  } = {}
) {
  const attributesWithTypes = args.filter(attr => !['--core'].includes(attr))
  const attributes = attributesWithTypes.map(str => str.split(':')[0])

  await sspawn(
    `yarn --cwd=../../node_modules/dream dream g:model ${fullyQualifiedModelName} ${attributesWithTypes.join(
      ' '
    )}`
  )

  if (args.includes('--core')) {
    console.log('--core argument provided, setting now')
    process.env.PSYCHIC_CORE_DEVELOPMENT = '1'
  }

  await generateController(
    route,
    fullyQualifiedModelName,
    ['create', 'index', 'show', 'update', 'destroy'],
    attributes
  )
  await generateSerializer(fullyQualifiedModelName, attributes)

  console.log('finished generating resource!')
  // if (process.env.NODE_ENV !== 'test') process.exit()
}

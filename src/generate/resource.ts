import * as pluralize from 'pluralize'
import generateController from './controller'
import generateSerializer from './serializer'
import sspawn from '../helpers/sspawn'

export default async function generateResource(
  route: string,
  modelName: string,
  args: string[],
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
  }: {
    rootPath?: string
  } = {}
) {
  const attributesWithTypes = args.filter(attr => !['--core'].includes(attr))
  const attributes = attributesWithTypes.map(str => str.split(':')[0])

  await sspawn(
    `yarn --cwd=../../node_modules/dream dream g:model ${modelName} ${attributesWithTypes.join(' ')}`
  )

  if (args.includes('--core')) {
    console.log('--core argument provided, setting now')
    process.env.CORE_DEVELOPMENT = '1'
  }

  console.log('Generating controller...')
  await generateController(route, modelName, ['create', 'index', 'show', 'update', 'destroy'], {
    allowExit: false,
    attributes,
  })

  console.log('Generating serializer...')
  await generateSerializer(modelName, attributes, { allowExit: false })

  console.log('finished generating resource!')
  // if (process.env.NODE_ENV !== 'test') process.exit()
}

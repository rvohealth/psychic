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
  const attributes = args.filter(attr => !['--core'].includes(attr))
  await sspawn(`yarn --cwd=../../node_modules/dream dream g:model ${modelName} ${attributes.join(' ')}`)

  // rebuild the model layer so controller and serializer builders
  // can read .psy/models.ts and get back the newly-generated model
  console.log('running migrations...')
  await sspawn('yarn --cwd=../../node_modules/dream dream db:migrate')

  if (args.includes('--core')) {
    console.log('--core argument provided, setting now')
    process.env.CORE_DEVELOPMENT = '1'
  }

  console.log('Generating controller...')
  await sspawn(
    `npx ts-node --transpile-only bin/cli.ts g:controller ${route} ${modelName} create index show update destroy`
  )
  // await generateController(pluralize(modelName), ['create', 'index', 'show', 'update', 'destroy'], {
  //   rootPath,
  //   allowExit: false,
  // })

  console.log('Generating serializer...')
  // await sspawn(`yarn psy g:serializer ${modelName} ${attributes.join(' ')}`)
  await sspawn(`npx ts-node --transpile-only bin/cli.ts g:serializer ${modelName} ${args.join(' ')}`)
  // await generateSerializer(modelName, attributes, { rootPath, allowExit: false })

  console.log('finished generating resource!')
  // if (process.env.NODE_ENV !== 'test') process.exit()
}

import * as pluralize from 'pluralize'
import * as fs from 'fs/promises'
import generateController from './controller'
import generateSerializer from './serializer'
import sspawn from '../helpers/sspawn'

export default async function generateResource(
  modelName: string,
  attributes: string[],
  {
    rootPath = process.cwd(),
  }: {
    rootPath?: string
  } = {}
) {
  const thisfs = fs ? fs : await import('fs/promises')
  // TODO: call dream generator here
  // await generateModel(modelName, attributes, { rootPath, allowExit: false })

  // rebuild the model layer so controller and serializer builders
  // can read .psy/models.ts and get back the newly-generated model
  console.log('rebuilding paths...')
  await sspawn('yarn build')

  await generateController(pluralize(modelName), ['create', 'index', 'show', 'update', 'destroy'], {
    rootPath,
    allowExit: false,
  })
  await generateSerializer(modelName, attributes, { rootPath, allowExit: false })

  console.log('done!')
  if (process.env.NODE_ENV !== 'test') process.exit()
}

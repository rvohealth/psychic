import * as pluralize from 'pluralize'
import * as fs from 'fs/promises'
import generateControllerString from './helpers/generateControllerString'
import pascalize from '../helpers/pascalize'
import generateBlankSpec from './controllerSpec'
import generateControllerSpec from './controllerSpec'

export default async function generateController(
  route: string,
  modelName: string | null = null,
  methods: string[],
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
    allowExit = true,
  }: {
    rootPath?: string
    allowExit?: boolean
  } = {}
) {
  const thisfs = fs ? fs : await import('fs/promises')
  const controllerString = await generateControllerString(route, modelName, methods)
  const srcPath = process.env.CORE_DEVELOPMENT === '1' ? 'test-app' : 'src'
  const controllerBasePath = `${rootPath}/${srcPath}/app/controllers`
  const controllerFilename = `${pascalize(pluralize(route))}`
  const controllerPathParts = route.split('/')

  // we don't need this value, just doing it so we can discard the file name and
  // thus only have the filepath left. This helps us handle a case where one wants
  // to generate a nested controller, like so:
  //    psy g:controller api/v1/users
  const controllerActualFilename = controllerPathParts.pop()

  const controllerPath = `${controllerBasePath}/${controllerFilename}.ts`
  console.log(`generating controller: ${controllerPath}`)

  const controllerName = `${pascalize(pluralize(route))}Controller`
  await generateControllerSpec(controllerName)

  // if they are generating a nested controller path,
  // we need to make sure the nested directories exist
  if (!!controllerPathParts.length) {
    const fullPath = [...controllerBasePath.split('/'), ...controllerPathParts].join('/')
    await thisfs.mkdir(fullPath, { recursive: true })
  }

  await thisfs.writeFile(controllerPath, controllerString)

  if (process.env.NODE_ENV !== 'test' && allowExit) {
    console.log('done generating controller')
    process.exit()
  }
}

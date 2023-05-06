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
  const srcPath = process.env.CORE_DEVELOPMENT === '1' ? 'test-app' : 'src'
  const controllerBasePath = `${rootPath}/${srcPath}/app/controllers`
  const pluralizedName = `${pluralize(route)}Controller`
  const controllerName = pascalize(pluralizedName)
  const controllerFilename = pluralizedName
    .split('/')
    .map(str => pascalize(str))
    .join('/')
  const controllerPathParts = controllerFilename.split('/').slice(0, -1)
  const controllerString = await generateControllerString(route, controllerName, modelName, methods)

  // if they are generating a nested controller path,
  // we need to make sure the nested directories exist
  if (!!controllerPathParts.length) {
    const fullPath = [...controllerBasePath.split('/'), ...controllerPathParts].join('/')
    await thisfs.mkdir(fullPath, { recursive: true })
  }

  const controllerPath = `${controllerBasePath}/${controllerFilename}.ts`
  const relativeControllerPath = controllerPath.replace(new RegExp(`^.*app/controllers`), 'app/controllers')
  console.log(`generating controller: ${relativeControllerPath}`)
  await thisfs.writeFile(controllerPath, controllerString)
  await generateControllerSpec(controllerFilename)

  if (process.env.NODE_ENV !== 'test' && allowExit) {
    console.log('done generating controller')
    process.exit()
  }
}

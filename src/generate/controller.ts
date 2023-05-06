import fileWriter from './helpers/fileWriter'
import generateControllerString from './helpers/generateControllerString'
import generateBlankSpecContent from './helpers/generateBlankSpecContent'

export default async function generateController(
  route: string,
  fullyQualifiedModelName: string | null = null,
  methods: string[],
  attributes: string[] = [],
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
  }: {
    rootPath?: string
  } = {}
) {
  await fileWriter(route, 'Controller', '.ts', 'app/controllers', rootPath, generateControllerString, [
    route,
    fullyQualifiedModelName,
    methods,
    attributes,
  ])

  await fileWriter(
    route,
    'Controller',
    '.spec.ts',
    'spec/unit/controllers',
    rootPath,
    generateBlankSpecContent
  )

  console.log('done generating controller')
}

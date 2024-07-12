import fileWriter from './helpers/fileWriter'
import generateControllerContent from './helpers/generateControllerContent'
import generateControllerSpecContent from './helpers/generateControllerSpecContent'
import absoluteFilePath from '../helpers/absoluteFilePath'

export default async function generateController(
  route: string,
  fullyQualifiedModelName: string,
  methods: string[],
  {
    rootPath = absoluteFilePath(''),
  }: {
    rootPath?: string
  } = {},
) {
  await fileWriter(route, 'Controller', '.ts', true, 'app/controllers', rootPath, generateControllerContent, [
    route,
    fullyQualifiedModelName,
    methods,
  ])

  await fileWriter(
    route,
    'Controller',
    '.spec.ts',
    true,
    'spec/unit/controllers',
    rootPath,
    generateControllerSpecContent,
  )
}

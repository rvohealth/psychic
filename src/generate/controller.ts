import fileWriter from './helpers/fileWriter'
import generateControllerString from './helpers/generateControllerString'
import generateBlankSpecContent from './helpers/generateBlankSpecContent'
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
  await fileWriter(route, 'Controller', '.ts', true, 'app/controllers', rootPath, generateControllerString, [
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
    generateBlankSpecContent,
  )
}

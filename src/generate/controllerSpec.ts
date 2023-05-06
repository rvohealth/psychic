import * as fs from 'fs/promises'
import generateBlankSpecContent from './helpers/generateBlankSpecContent'

export default async function generateControllerSpec(
  controllerName: string,
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() + '/test-app' : process.cwd() + '/../..',
  }: {
    rootPath?: string
  } = {}
) {
  const specPath = `${rootPath}/spec/unit/controllers/${controllerName}.spec.ts`
  const specDirPath = specPath.split('/').slice(0, -1).join('/')
  const relativeSpecPath = specPath.replace(new RegExp(`^.*spec/unit`), 'spec/unit')
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating spec: ${relativeSpecPath}`)
    await thisfs.mkdir(specDirPath, { recursive: true })
    await thisfs.writeFile(specPath, generateBlankSpecContent(controllerName))
  } catch (error) {
    const err = `
      Something happened while trying to create the spec file:
        ${relativeSpecPath}

      Does this file already exist? Here is the error that was raised:
        ${error}
    `
    throw err
  }
}

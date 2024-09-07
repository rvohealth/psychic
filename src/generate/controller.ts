import { standardizeFullyQualifiedModelName } from '@rvohealth/dream'
import fs from 'fs/promises'
import pluralize from 'pluralize'
import psychicFileAndDirPaths from '../helpers/path/psychicFileAndDirPaths'
import psychicPath from '../helpers/path/psychicPath'
import generateControllerContent from './helpers/generateControllerContent'
import generateControllerSpecContent from './helpers/generateControllerSpecContent'

export default async function generateController({
  route,
  fullyQualifiedModelName,
  actions,
}: {
  route: string
  fullyQualifiedModelName: string
  actions: string[]
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const fullyQualifiedControllerName = `${pluralize(fullyQualifiedModelName)}Controller`

  const { relFilePath, absDirPath, absFilePath } = psychicFileAndDirPaths(
    psychicPath('controllers'),
    fullyQualifiedControllerName + `.ts`,
  )

  try {
    console.log(`generating controller: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      generateControllerContent({ fullyQualifiedControllerName, route, fullyQualifiedModelName, actions }),
    )
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the controller file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }

  await generateControllerSpec(fullyQualifiedControllerName) //, route, fullyQualifiedModelName, methods)
}

async function generateControllerSpec(
  fullyQualifiedControllerName: string,
  // route: string,
  // fullyQualifiedModelName: string,
  // methods: string[],
) {
  const { relFilePath, absDirPath, absFilePath } = psychicFileAndDirPaths(
    psychicPath('controllerSpecs'),
    fullyQualifiedControllerName + `.spec.ts`,
  )

  try {
    console.log(`generating controller: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      generateControllerSpecContent(fullyQualifiedControllerName), //, route, fullyQualifiedModelName, methods),
    )
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the controller spec file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }
}

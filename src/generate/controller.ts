import { hyphenize, standardizeFullyQualifiedModelName } from '@rvohealth/dream'
import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import EnvInternal from '../helpers/EnvInternal.js'
import psychicFileAndDirPaths from '../helpers/path/psychicFileAndDirPaths.js'
import psychicPath from '../helpers/path/psychicPath.js'
import generateControllerContent from './helpers/generateControllerContent.js'
import generateControllerSpecContent from './helpers/generateControllerSpecContent.js'
import generateResourceControllerSpecContent from './helpers/generateResourceControllerSpecContent.js'

export default async function generateController({
  fullyQualifiedControllerName,
  fullyQualifiedModelName,
  actions,
  columnsWithTypes = [],
  resourceSpecs = false,
}: {
  fullyQualifiedControllerName: string
  fullyQualifiedModelName?: string
  actions: string[]
  columnsWithTypes?: string[]
  resourceSpecs?: boolean
}) {
  fullyQualifiedModelName = fullyQualifiedModelName
    ? standardizeFullyQualifiedModelName(fullyQualifiedModelName)
    : fullyQualifiedModelName

  fullyQualifiedControllerName = standardizeFullyQualifiedModelName(
    `${fullyQualifiedControllerName.replace(/Controller$/, '')}Controller`,
  )
  const route = hyphenize(fullyQualifiedControllerName.replace(/Controller$/, ''))

  const allControllerNameParts = fullyQualifiedControllerName.split('/')
  const isAdmin = allControllerNameParts[0] === 'Admin'
  const controllerNameParts: string[] = isAdmin ? [allControllerNameParts.shift()!] : []

  for (let index = 0; index < allControllerNameParts.length; index++) {
    if (controllerNameParts.length) {
      // Write the ancestor controller
      const [baseAncestorName, baseAncestorImportStatement] = baseAncestorNameAndImport(
        controllerNameParts,
        isAdmin,
        { forBaseController: true },
      )

      const baseControllerName = [...controllerNameParts, 'BaseController'].join('/')
      const { absDirPath, absFilePath } = psychicFileAndDirPaths(
        psychicPath('controllers'),
        baseControllerName + `.ts`,
      )

      await fs.mkdir(absDirPath, { recursive: true })

      if (!existsSync(absFilePath)) {
        await fs.writeFile(
          absFilePath,
          generateControllerContent({
            ancestorImportStatement: baseAncestorImportStatement,
            ancestorName: baseAncestorName,
            fullyQualifiedControllerName: baseControllerName,
            omitOpenApi: true,
          }),
        )
      }
    }

    controllerNameParts.push(allControllerNameParts[index])
  }

  // Write the controller
  const [ancestorName, ancestorImportStatement] = baseAncestorNameAndImport(controllerNameParts, isAdmin, {
    forBaseController: false,
  })

  const { relFilePath, absDirPath, absFilePath } = psychicFileAndDirPaths(
    psychicPath('controllers'),
    fullyQualifiedControllerName + `.ts`,
  )
  await fs.mkdir(absDirPath, { recursive: true })

  try {
    if (!EnvInternal.isTest) console.log(`generating controller: ${relFilePath}`)

    await fs.writeFile(
      absFilePath,
      generateControllerContent({
        ancestorImportStatement,
        ancestorName,
        fullyQualifiedControllerName,
        fullyQualifiedModelName,
        actions,
      }),
    )
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the controller file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }

  await generateControllerSpec({
    fullyQualifiedControllerName,
    route,
    fullyQualifiedModelName,
    columnsWithTypes,
    resourceSpecs,
  })
}

function baseAncestorNameAndImport(
  controllerNameParts: string[],
  isAdmin: boolean,
  { forBaseController }: { forBaseController: boolean },
) {
  const maybeAncestorNameForBase = `${controllerNameParts.slice(0, controllerNameParts.length - 1).join('')}BaseController`
  const dotFiles = forBaseController ? '..' : '.'
  return controllerNameParts.length === (isAdmin ? 2 : 1)
    ? isAdmin
      ? [`AdminAuthedController`, `import AdminAuthedController from '${dotFiles}/AuthedController'`]
      : [`AuthedController`, `import AuthedController from '${dotFiles}/AuthedController'`]
    : [maybeAncestorNameForBase, `import ${maybeAncestorNameForBase} from '${dotFiles}/BaseController'`]
}

async function generateControllerSpec({
  fullyQualifiedControllerName,
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
  resourceSpecs,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string | undefined
  columnsWithTypes: string[]
  resourceSpecs: boolean
}) {
  const { relFilePath, absDirPath, absFilePath } = psychicFileAndDirPaths(
    psychicPath('controllerSpecs'),
    fullyQualifiedControllerName + `.spec.ts`,
  )

  try {
    if (!EnvInternal.isTest) console.log(`generating controller: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      resourceSpecs && fullyQualifiedModelName
        ? generateResourceControllerSpecContent({
            fullyQualifiedControllerName,
            route,
            fullyQualifiedModelName,
            columnsWithTypes,
          })
        : generateControllerSpecContent(fullyQualifiedControllerName), //, route, fullyQualifiedModelName, actions),
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

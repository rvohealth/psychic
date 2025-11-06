import { DreamApp } from '@rvoh/dream'
import { hyphenize } from '@rvoh/dream/utils'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import UnexpectedUndefined from '../error/UnexpectedUndefined.js'
import addImportSuffix from '../helpers/path/addImportSuffix.js'
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
  owningModel,
  singular,
}: {
  fullyQualifiedControllerName: string
  fullyQualifiedModelName?: string
  actions: string[]
  columnsWithTypes?: string[]
  resourceSpecs?: boolean
  owningModel?: string | undefined
  singular: boolean
}) {
  fullyQualifiedModelName = fullyQualifiedModelName
    ? DreamApp.system.standardizeFullyQualifiedModelName(fullyQualifiedModelName)
    : fullyQualifiedModelName

  fullyQualifiedControllerName = DreamApp.system.standardizeFullyQualifiedModelName(
    `${fullyQualifiedControllerName.replace(/Controller$/, '')}Controller`,
  )

  const route = hyphenize(fullyQualifiedControllerName.replace(/Controller$/, ''))

  const pathParamRegexp = /\/\{[^}]*\}\//g
  fullyQualifiedControllerName = fullyQualifiedControllerName.replace(pathParamRegexp, '/')
  const allControllerNameParts = fullyQualifiedControllerName.split('/')
  const forAdmin = allControllerNameParts[0] === 'Admin'

  const controllerNameParts: string[] = forAdmin ? [allControllerNameParts.shift()!] : []

  for (let index = 0; index < allControllerNameParts.length; index++) {
    if (controllerNameParts.length > (forAdmin ? 1 : 0)) {
      // Write the ancestor controller
      const [baseAncestorName, baseAncestorImportStatement] = baseAncestorNameAndImport(
        controllerNameParts,
        forAdmin,
        { forBaseController: true },
      )

      if (baseAncestorName === undefined) throw new UnexpectedUndefined()
      if (baseAncestorImportStatement === undefined) throw new UnexpectedUndefined()

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
            forAdmin,
            singular,
          }),
        )
      }
    }

    const namedPart = allControllerNameParts[index]
    if (namedPart) controllerNameParts.push(namedPart)
  }

  // Write the controller
  const [ancestorName, ancestorImportStatement] = baseAncestorNameAndImport(controllerNameParts, forAdmin, {
    forBaseController: false,
  })

  if (ancestorName === undefined) throw new UnexpectedUndefined()
  if (ancestorImportStatement === undefined) throw new UnexpectedUndefined()

  const { relFilePath, absDirPath, absFilePath } = psychicFileAndDirPaths(
    psychicPath('controllers'),
    fullyQualifiedControllerName + `.ts`,
  )
  await fs.mkdir(absDirPath, { recursive: true })

  try {
    console.log(`generating controller: ${relFilePath}`)

    await fs.writeFile(
      absFilePath,
      generateControllerContent({
        ancestorImportStatement,
        ancestorName,
        fullyQualifiedControllerName,
        fullyQualifiedModelName,
        actions,
        owningModel,
        forAdmin,
        singular,
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
    owningModel,
    forAdmin,
    singular,
    actions,
  })
}

function baseAncestorNameAndImport(
  controllerNameParts: string[],
  forAdmin: boolean,
  { forBaseController }: { forBaseController: boolean },
) {
  const maybeAncestorNameForBase = `${controllerNameParts.slice(0, controllerNameParts.length - 1).join('')}BaseController`
  const dotFiles = forBaseController ? '..' : '.'
  return controllerNameParts.length === (forAdmin ? 2 : 1)
    ? forAdmin
      ? [
          `AdminAuthedController`,
          `import AdminAuthedController from '${dotFiles}/${addImportSuffix('AuthedController.js')}'`,
        ]
      : [
          `AuthedController`,
          `import AuthedController from '${dotFiles}/${addImportSuffix('AuthedController.js')}'`,
        ]
    : [
        maybeAncestorNameForBase,
        `import ${maybeAncestorNameForBase} from '${dotFiles}/${addImportSuffix('BaseController.js')}'`,
      ]
}

async function generateControllerSpec({
  fullyQualifiedControllerName,
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
  resourceSpecs,
  owningModel,
  forAdmin,
  singular,
  actions,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string | undefined
  columnsWithTypes: string[]
  resourceSpecs: boolean
  owningModel: string | undefined
  forAdmin: boolean
  singular: boolean
  actions: string[]
}) {
  const { relFilePath, absDirPath, absFilePath } = psychicFileAndDirPaths(
    psychicPath('controllerSpecs'),
    fullyQualifiedControllerName + `.spec.ts`,
  )

  try {
    console.log(`generating controller spec: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(
      absFilePath,
      resourceSpecs && fullyQualifiedModelName
        ? generateResourceControllerSpecContent({
            fullyQualifiedControllerName,
            route,
            fullyQualifiedModelName,
            columnsWithTypes,
            owningModel,
            forAdmin,
            singular,
            actions,
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

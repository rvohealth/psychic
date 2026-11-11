import { DreamApp } from '@rvoh/dream'
import { hyphenize } from '@rvoh/dream/utils'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {
  differsFromExistingContents,
  FileWriteTarget,
  readExistingContents,
} from '../cli/helpers/applyConfirmedWriteSet.js'
import UnexpectedUndefined from '../error/UnexpectedUndefined.js'
import addImportSuffix from '../helpers/path/addImportSuffix.js'
import psychicFileAndDirPaths from '../helpers/path/psychicFileAndDirPaths.js'
import psychicPath from '../helpers/path/psychicPath.js'
import generateControllerContent from './helpers/generateControllerContent.js'
import generateControllerSpecContent from './helpers/generateControllerSpecContent.js'
import generateResourceControllerSpecContent from './helpers/generateResourceControllerSpecContent.js'

/**
 * Thrown by `g:controller` and `g:resource`, before anything is written, when
 * the controller or controller spec they would write already exists with
 * different content and the run did not ask to replace it.
 */
export class ControllerFilesAlreadyExist extends Error {
  constructor(
    public readonly controllerName: string,
    public readonly existingFiles: string[],
    reRunAdvice: string,
  ) {
    super(`\
Refusing to generate ${controllerName}, because these files already exist with different content:
${existingFiles.map(file => `  ${file}`).join('\n')}

Nothing was written. ${reRunAdvice}`)
  }
}

interface GenerateControllerArgs {
  fullyQualifiedControllerName: string
  fullyQualifiedModelName?: string | undefined
  actions: string[]
  columnsWithTypes?: string[]
  resourceSpecs?: boolean
  owningModel?: string | undefined
  singular: boolean
}

interface ControllerFileTarget extends FileWriteTarget {
  relFilePath: string
  description: 'controller' | 'controller spec'
}

/**
 * Generates a controller, the namespace `BaseController`s leading to it that do
 * not exist yet, and its spec. When the controller or its spec already exists
 * with different content, it writes nothing and throws
 * {@link ControllerFilesAlreadyExist}, unless `overwrite` is passed. An existing
 * `BaseController` is never replaced.
 */
export default async function generateController({
  overwrite = false,
  ...args
}: GenerateControllerArgs & { overwrite?: boolean }) {
  const writeControllerFiles = await prepareController(args, {
    overwrite,
    reRunAdvice: 'To replace them, re-run with --overwrite.',
  })
  await writeControllerFiles()
}

/**
 * Builds every file {@link generateController} writes and checks the controller
 * and its spec against disk, throwing {@link ControllerFilesAlreadyExist} before
 * anything is written when either exists with different content and `overwrite`
 * is false. Returns the function that writes them, so that `g:resource` can
 * refuse before its model files are generated and write the controller after.
 */
export async function prepareController(
  {
    fullyQualifiedControllerName,
    fullyQualifiedModelName,
    actions,
    columnsWithTypes = [],
    resourceSpecs = false,
    owningModel,
    singular,
  }: GenerateControllerArgs,
  { overwrite, reRunAdvice }: { overwrite: boolean; reRunAdvice: string },
): Promise<() => Promise<void>> {
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
  const forInternal = allControllerNameParts[0] === 'Internal'

  const controllerNameParts: string[] = forAdmin || forInternal ? [allControllerNameParts.shift()!] : []

  const baseControllers: FileWriteTarget[] = []

  for (let index = 0; index < allControllerNameParts.length; index++) {
    if (controllerNameParts.length > (forAdmin || forInternal ? 1 : 0)) {
      // The ancestor controller
      const [baseAncestorName, baseAncestorImportStatement] = baseAncestorNameAndImport(
        controllerNameParts,
        forAdmin,
        forInternal,
        { forBaseController: true },
      )

      if (baseAncestorName === undefined) throw new UnexpectedUndefined()
      if (baseAncestorImportStatement === undefined) throw new UnexpectedUndefined()

      const baseControllerName = [...controllerNameParts, 'BaseController'].join('/')
      const { absFilePath } = psychicFileAndDirPaths(psychicPath('controllers'), baseControllerName + `.ts`)

      baseControllers.push({
        filePath: absFilePath,
        contents: generateControllerContent({
          ancestorImportStatement: baseAncestorImportStatement,
          ancestorName: baseAncestorName,
          fullyQualifiedControllerName: baseControllerName,
          omitOpenApi: true,
          forAdmin,
          forInternal,
          singular,
        }),
      })
    }

    const namedPart = allControllerNameParts[index]
    if (namedPart) controllerNameParts.push(namedPart)
  }

  // The controller
  const [ancestorName, ancestorImportStatement] = baseAncestorNameAndImport(
    controllerNameParts,
    forAdmin,
    forInternal,
    {
      forBaseController: false,
    },
  )

  if (ancestorName === undefined) throw new UnexpectedUndefined()
  if (ancestorImportStatement === undefined) throw new UnexpectedUndefined()

  const controllerPaths = psychicFileAndDirPaths(
    psychicPath('controllers'),
    fullyQualifiedControllerName + `.ts`,
  )
  const controller: ControllerFileTarget = {
    filePath: controllerPaths.absFilePath,
    relFilePath: controllerPaths.relFilePath,
    description: 'controller',
    contents: generateControllerContent({
      ancestorImportStatement,
      ancestorName,
      fullyQualifiedControllerName,
      fullyQualifiedModelName,
      actions,
      owningModel,
      forAdmin,
      forInternal,
      singular,
      columnsWithTypes,
    }),
  }

  const specPaths = psychicFileAndDirPaths(
    psychicPath('controllerSpecs'),
    fullyQualifiedControllerName + `.spec.ts`,
  )
  const spec: ControllerFileTarget = {
    filePath: specPaths.absFilePath,
    relFilePath: specPaths.relFilePath,
    description: 'controller spec',
    contents:
      resourceSpecs && fullyQualifiedModelName
        ? generateResourceControllerSpecContent({
            fullyQualifiedControllerName,
            route,
            fullyQualifiedModelName,
            columnsWithTypes,
            owningModel,
            forAdmin,
            forInternal,
            singular,
            actions,
          })
        : generateControllerSpecContent(fullyQualifiedControllerName),
  }

  const differingFiles = (await readExistingContents([controller, spec])).filter(differsFromExistingContents)
  if (differingFiles.length && !overwrite)
    throw new ControllerFilesAlreadyExist(
      fullyQualifiedControllerName,
      differingFiles.map(file => file.relFilePath),
      reRunAdvice,
    )

  return async () => {
    for (const baseController of baseControllers) {
      await fs.mkdir(path.dirname(baseController.filePath), { recursive: true })
      if (!existsSync(baseController.filePath))
        await fs.writeFile(baseController.filePath, baseController.contents)
    }

    for (const file of [controller, spec]) {
      try {
        console.log(`generating ${file.description}: ${file.relFilePath}`)
        await fs.mkdir(path.dirname(file.filePath), { recursive: true })
        await fs.writeFile(file.filePath, file.contents)
      } catch (error) {
        throw new Error(
          `
      Something happened while trying to write the ${file.description} file:
        ${file.relFilePath}

      Here is the error that was raised:
        ${(error as Error).message}
    `,
          { cause: error },
        )
      }
    }
  }
}

function baseAncestorNameAndImport(
  controllerNameParts: string[],
  forAdmin: boolean,
  forInternal: boolean,
  { forBaseController }: { forBaseController: boolean },
) {
  const maybeAncestorNameForBase = `${controllerNameParts.slice(0, controllerNameParts.length - 1).join('')}BaseController`
  const dotFiles = forBaseController ? '..' : '.'
  return controllerNameParts.length === (forAdmin || forInternal ? 2 : 1)
    ? forAdmin
      ? [
          `AdminAuthedController`,
          `import AdminAuthedController from '${dotFiles}/${addImportSuffix('AuthedController.js')}'`,
        ]
      : forInternal
        ? [
            `InternalAuthedController`,
            `import InternalAuthedController from '${dotFiles}/${addImportSuffix('AuthedController.js')}'`,
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

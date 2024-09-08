import { standardizeFullyQualifiedModelName } from '@rvohealth/dream'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import psychicFileAndDirPaths from '../helpers/path/psychicFileAndDirPaths'
import psychicPath from '../helpers/path/psychicPath'
import generateControllerContent from './helpers/generateControllerContent'
import generateControllerSpecContent from './helpers/generateControllerSpecContent'

export default async function generateController({
  fullyQualifiedControllerName,
  fullyQualifiedModelName,
  actions,
}: {
  fullyQualifiedControllerName: string
  fullyQualifiedModelName?: string
  actions: string[]
}) {
  fullyQualifiedModelName = fullyQualifiedModelName
    ? standardizeFullyQualifiedModelName(fullyQualifiedModelName)
    : fullyQualifiedModelName

  fullyQualifiedControllerName = standardizeFullyQualifiedModelName(
    `${fullyQualifiedControllerName.replace(/Controller$/, '')}Controller`,
  )

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
    console.log(`generating controller: ${relFilePath}`)
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

  await generateControllerSpec(fullyQualifiedControllerName) //, route, fullyQualifiedModelName, methods)
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

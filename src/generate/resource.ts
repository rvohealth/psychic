import { DreamApp } from '@rvoh/dream'
import { DreamCLI } from '@rvoh/dream/system'
import pluralize from 'pluralize-esm'
import { prepareController } from './controller.js'
import addResourceToRoutes from './helpers/addResourceToRoutes.js'

export const RESOURCE_ACTIONS = ['index', 'show', 'create', 'update', 'destroy'] as const
export const SINGULAR_RESOURCE_ACTIONS = ['show', 'create', 'update', 'destroy'] as const

/**
 * What `g:resource` does when a file it would write already exists:
 * - `'refuse'`: write nothing and throw an error listing the existing files.
 *   Psychic refuses over a controller or controller spec with different
 *   content; Dream refuses over any existing model, model spec, factory,
 *   serializer or matching create migration
 * - `'overwrite'` (`--overwrite`): replace the controller and controller spec,
 *   and Dream's model, model spec, factory and serializer files
 * - `'overwritePsychicOnly'` (`--overwrite-psychic-only`): replace the
 *   controller and controller spec, keep every existing Dream file, and write
 *   only the missing ones (no create migration when the model file exists)
 */
export type GenerateResourceExistingFiles = 'refuse' | 'overwrite' | 'overwritePsychicOnly'

const DREAM_EXISTING_FILES = {
  refuse: 'refuse',
  overwrite: 'overwrite',
  overwritePsychicOnly: 'skip',
} as const satisfies Record<GenerateResourceExistingFiles, 'refuse' | 'overwrite' | 'skip'>

// the flags Dream's refusal names in place of its own `--overwrite` and `--skip-existing`
const EXISTING_FILES_FLAGS = { overwrite: '--overwrite', skip: '--overwrite-psychic-only' }

export default async function generateResource({
  route,
  fullyQualifiedModelName,
  options,
  columnsWithTypes,
}: {
  route: string
  fullyQualifiedModelName: string
  options: {
    singular: boolean
    only?: string
    stiBaseSerializer: boolean
    owningModel?: string
    connectionName: string
    tableName?: string
    modelName?: string
    softDelete: boolean
    existingFiles?: GenerateResourceExistingFiles | undefined
  }
  columnsWithTypes: string[]
}) {
  const existingFiles = options.existingFiles ?? 'refuse'

  // sanitize route here, making sure that the leading
  // slash is not passed through to subsequent helpers,
  // which will exhibit bad behavior when provided with
  // a prefixing slash.
  route = route.replace(/^\/+/, '')
  if (!options.singular) route = pluralize(route)

  const fullyQualifiedControllerName = DreamApp.system.standardizeFullyQualifiedModelName(route)
  const resourcefulActions = options.singular ? [...SINGULAR_RESOURCE_ACTIONS] : [...RESOURCE_ACTIONS]
  const onlyActions = options.only?.split(',')
  // The routes file is given the controller's actions, not the raw --only, so an --only entry the resource
  // has no action for (`index` with --singular, or a misspelling) is neither generated nor routed.
  const actions = onlyActions
    ? resourcefulActions.filter(action => onlyActions.includes(action))
    : resourcefulActions

  const forAdmin = /^Admin\//.test(fullyQualifiedControllerName)
  const forInternal = /^Internal\//.test(fullyQualifiedControllerName)

  const standardizedModelName = DreamApp.system.standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  // Checked before Dream runs, so that refusing over the controller or its spec writes nothing at all
  const writeController = await prepareController(
    {
      fullyQualifiedControllerName,
      fullyQualifiedModelName,
      actions,
      columnsWithTypes,
      resourceSpecs: true,
      singular: options.singular,
      owningModel: options.owningModel,
    },
    {
      overwrite: existingFiles !== 'refuse',
      reRunAdvice: `To replace them, re-run with --overwrite, which also replaces any existing model, spec, factory and serializer files for ${standardizedModelName}. To replace them but keep any existing model, spec, factory, serializer and migration files for ${standardizedModelName}, writing only the missing ones, re-run with --overwrite-psychic-only.`,
    },
  )

  await DreamCLI.generateDream({
    fullyQualifiedModelName,
    columnsWithTypes,
    options: {
      serializer: true,
      stiBaseSerializer: options.stiBaseSerializer,
      includeAdminSerializers: forAdmin,
      includeInternalSerializers: forInternal,
      connectionName: options.connectionName,
      tableName: options.tableName,
      modelName: options.modelName,
      softDelete: options.softDelete,
      existingFiles: DREAM_EXISTING_FILES[existingFiles],
      existingFilesFlags: EXISTING_FILES_FLAGS,
    },
  })

  await writeController()

  await addResourceToRoutes(route, {
    singular: options.singular,
    onlyActions: onlyActions ? actions : undefined,
  })
}

import { ConfirmOverwriteFn } from '../../cli/helpers/applyConfirmedWriteSet.js'
import generateInitializer from '../helpers/syncOpenapiTypescript/generateInitializer.js'
import installOpenapiTypescript from '../helpers/syncOpenapiTypescript/installOpenapiTypescript.js'

export default async function generateSyncOpenapiTypescriptInitializer(
  openapiFilepath: string,
  outfile: string,
  initializerFilename: `${string}.ts` = 'sync-openapi-typescript.ts',
  {
    confirm,
  }: {
    confirm?: ConfirmOverwriteFn | undefined
  } = {},
) {
  const applied = await generateInitializer(openapiFilepath, outfile, initializerFilename, { confirm })
  // declining the overwrite prompt must also skip the follow-on package
  // install (mirroring the redux/zustand binding generators)
  if (!applied) return

  await installOpenapiTypescript()
}

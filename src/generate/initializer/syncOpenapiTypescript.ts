import generateInitializer from '../helpers/syncOpenapiTypescript/generateInitializer.js'
import installOpenapiTypescript from '../helpers/syncOpenapiTypescript/installOpenapiTypescript.js'

export default async function generateSyncOpenapiTypescriptInitializer(
  openapiFilepath: string,
  outfile: string,
  initializerFilename: `${string}.ts` = 'sync-openapi-typescript.ts',
) {
  await generateInitializer(openapiFilepath, outfile, initializerFilename)
  await installOpenapiTypescript()
}

import { DreamImporter } from '@rvohealth/dream'
import srcPath from '../../app/helpers/srcPath'

export default async function importModels() {
  return await DreamImporter.importDreams(
    srcPath('app', 'models'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    async path => (await import(path)).default,
  )
}

import { DreamImporter } from '@rvohealth/dream'
import srcPath from '../../app/helpers/srcPath'

export default async function importServices() {
  return await DreamImporter.importServices(
    srcPath('app', 'services'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    async path => (await import(path)).default,
  )
}

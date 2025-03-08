import { DreamImporter } from '@rvohealth/dream'
import srcPath from '../../app/helpers/srcPath'

export default async function loadServices() {
  const servicePaths = await DreamImporter.ls(srcPath('app', 'services'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return await DreamImporter.importServices(servicePaths, async path => (await import(path)).default)
}

import { DreamImporter } from '@rvohealth/dream'
import srcPath from '../../app/helpers/srcPath'

export default async function loadModels() {
  const modelPaths = await DreamImporter.ls(srcPath('app', 'models'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return await DreamImporter.importDreams(modelPaths, async path => (await import(path)).default)
}

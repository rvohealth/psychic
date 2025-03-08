import { DreamImporter } from '@rvohealth/dream'
import srcPath from '../../app/helpers/srcPath'

export default async function loadServices() {
  const serializerPaths = await DreamImporter.ls(srcPath('app', 'serializers'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await DreamImporter.importSerializers(serializerPaths, async path => await import(path))
}

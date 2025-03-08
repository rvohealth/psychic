import { DreamImporter } from '@rvohealth/dream'
import srcPath from '../../app/helpers/srcPath'

export default async function importSerializers() {
  return await DreamImporter.importSerializers(
    srcPath('app', 'serializers'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    async path => await import(path),
  )
}

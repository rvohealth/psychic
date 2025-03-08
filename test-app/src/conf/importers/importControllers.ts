import PsychicImporter from '../../../../src/psychic-application/helpers/PsychicImporter'
import srcPath from '../../app/helpers/srcPath'

export default async function importControllers() {
  return await PsychicImporter.importControllers(
    srcPath('app', 'controllers'),

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    async path => (await import(path)).default,
  )
}

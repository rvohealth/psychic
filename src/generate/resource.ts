import { generateDream } from '@rvohealth/dream'
import generateController from './controller'

export default async function generateResource(
  route: string,
  fullyQualifiedModelName: string,
  args: string[],
) {
  await generateDream(fullyQualifiedModelName, args)

  if (args.includes('--core')) {
    console.log('--core argument provided, setting now')
    process.env.PSYCHIC_CORE_DEVELOPMENT = '1'
  }

  await generateController(route, fullyQualifiedModelName, ['create', 'index', 'show', 'update', 'destroy'])
}

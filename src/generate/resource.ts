import generateController from './controller'
import sspawn from '../helpers/sspawn'
import dreamjsOrDreamtsCmd from '../../boot/cli/helpers/dreamjsOrDreamtsCmd'
import omitCoreArg from '../../boot/cli/helpers/omitCoreArg'

export default async function generateResource(
  route: string,
  fullyQualifiedModelName: string,
  args: string[]
) {
  const attributesWithTypes = args.filter(attr => !/^--/.test(attr))
  const columnAttributes = attributesWithTypes.filter(attr => isColumn(attr)).map(attr => attr.split(':')[0]!)

  console.log({
    attributesWithTypes,
    columnAttributes,
    route: `g:model ${fullyQualifiedModelName} ${attributesWithTypes.join(' ')}`,
  })

  await sspawn(
    dreamjsOrDreamtsCmd(
      `g:model ${fullyQualifiedModelName} ${attributesWithTypes.join(' ')}`,
      omitCoreArg(args)
    )
  )

  if (args.includes('--core')) {
    console.log('--core argument provided, setting now')
    process.env.PSYCHIC_CORE_DEVELOPMENT = '1'
  }

  await generateController(
    route,
    fullyQualifiedModelName,
    ['create', 'index', 'show', 'update', 'destroy'],
    columnAttributes
  )
  // if (process.env.NODE_ENV !== 'test') process.exit()
}

function isColumn(attribute: string) {
  const [_, columnType] = attribute.split(':')
  return !['belongs_to', 'has_one', 'has_many'].includes(columnType)
}

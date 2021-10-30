import l from 'src/singletons/l'
import File from 'src/helpers/file'
import pluralize from 'pluralize'
import config from 'src/config'

export default class GenerateChannel {
  async generate(args) {
    const [ channelName ] = args
    const filepath = `app/channels/${channelName.hyphenize()}.js`

    await File.write(config.pathTo(filepath), channelTemplate(...args))
    l.log(`wrote channel to: ${config.pathTo(filepath)}`)

    // if (!process.env.CORE_TEST && !process.env.CORE_INTEGRATION_TEST)
    //   return process.exit()
  }
}

function routeTemplate(channelName, routeName) {
  const dreamName = pluralize.singular(channelName)
  switch(routeName) {
  case 'auth':
    return ''

  case 'create':
    return `
  async create() {
    const ${dreamName} = await ${dreamName.pascalize()}.create(this.paramsFor(${dreamName.pascalize()}))
    this.json(${dreamName})
  }
`

  case 'update':
    return `
  async update() {
    const ${dreamName} = await ${dreamName.pascalize()}.find(this.params.id)
    await ${dreamName}.update(this.paramsFor(${dreamName.pascalize()}))
    this.json(${dreamName})
  }
`

  case 'delete':
    return `
  async delete() {
    const ${dreamName} = await ${dreamName.pascalize()}.find(this.params.id)
    await ${dreamName}.delete()
    this.json({ id: ${dreamName}.id })
  }
`

  case 'index':
    return `
  async index() {
    const ${dreamName.pluralize()} = await ${dreamName.pascalize()}.all()
    this.json(${dreamName.pluralize()})
  }
`

  case 'show':
    return `
  async show() {
    const ${dreamName} = await ${dreamName.pascalize()}.find(this.params.id)
    this.json(${dreamName})
  }
`

  default:
    if (/:/.test(routeName)) return ''

    return `
  async ${routeName}() {
  }
`
  }
}

function initializeTemplate(channelName, ...routes) {
  const dreamName = pluralize.singular(channelName)
  const keyField = routes.find(r => /key:/.test(r))?.split(':')?.second || 'email'
  const passField = routes.find(r => /password:/.test(r))?.split(':')?.second || 'password'

  if (routes.includes('auth'))
    return `\
  initialize() {
    this.authenticates('${dreamName}', { against: '${keyField}:${passField}', as: 'current${dreamName.pascalize()}' })
  }`

  return ''
}

function importStatements(channelName, ...routes) {
  if (routes.includes('auth'))
    return `\
import ${pluralize.singular(channelName.pascalize())} from 'app/dreams/${pluralize.singular(channelName).hyphenize()}'\
`

  return ''
}

export function channelTemplate(channelName, ...routes) {
  return (
`\
import { Channel } from 'psychic'
${importStatements(channelName, ...routes)}

export default class ${channelName.pascalize()}Channel extends Channel {
${initializeTemplate(channelName, ...routes)}
${routes.map(route => routeTemplate(channelName, route)).join("").replace(/\n$/, '')}
}
`
  )
}

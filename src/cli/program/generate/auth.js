import l from 'src/singletons/l'
import File from 'src/helpers/file'
import config from 'src/config'
import moment from 'moment'
import GenerateSignInComponent from 'src/cli/program/generate/js/components/sign-in'

class ArgsParser {
  constructor(args) {
    this.args = JSON.parse(JSON.stringify(args))
  }

  get dreamName() {
    return this.args
      .filter(arg => arg.split(':')[0] === 'dream')
      ?.first
      ?.replace('dream:', '') ||
      'user'
  }

  get keyField() {
    return this.args
      .filter(arg => arg.split(':')[0] === 'key')
      ?.first
      ?.replace('key:', '') ||
      'email'
  }

  get passwordField() {
    return this.args
      .filter(arg => arg.split(':')[0] === 'password')
      ?.first
      ?.replace('password:', '') ||
      'password'
  }
}

export default class GenerateAuth {
  async generate(args) {
    const _args = new ArgsParser(args)

    await this._addRoute(_args.dreamName)
    await this._generateDream(_args.dreamName, _args.keyField, _args.passwordField)
    await this._generateMigration(_args.dreamName, _args.keyField, _args.passwordField)
    await this._generateChannel(_args.dreamName, _args.keyField, _args.passwordField)
    await this._generateSpec(_args.dreamName)

    // TODO: add support for namespaced routes, leaving blank for now
    const namespace = null

    await this._generateSignInComponent(_args.dreamName, namespace, _args.keyField, _args.passwordField)

    if (!process.env.CORE_TEST)
      return process.exit()
  }

  async _generateChannel(dreamName, keyField, passwordField) {
    const filepath = `app/channels/${dreamName.hyphenize().pluralize()}.js`

    if (await File.exists(filepath)) {
      l.log(
`\


Could not write to ${config.pathTo(filepath)}
make sure to add an authentication block to ${config.pathTo(filepath)}
e.g

${channelTemplate(dreamName, keyField, passwordField)}
`,
        { level: 'warning' }
      )
    } else {
      await File.write(config.pathTo(filepath), channelTemplate(dreamName, keyField, passwordField))
      l.log(`wrote new dream to: ${filepath}`)
    }
  }

  async _generateDream(dreamName, keyField, passwordField) {
    const filepath = `app/dreams/${dreamName.hyphenize()}.js`

    if (await File.exists(config.pathTo(filepath))) {
      l.log(
`\


Could not write to ${config.pathTo(filepath)}
make sure to add an authentication block to ${config.pathTo(filepath)}
e.g

${dreamTemplate(dreamName, keyField, passwordField)}
`,
        { level: 'warning' }
      )
      return
    }

    await File.write(config.pathTo(filepath), dreamTemplate(dreamName, keyField, passwordField))
    l.log(`wrote new dream to: ${filepath}`)
  }

  async _generateMigration(dreamName, keyField, passwordField) {
    const timestamp = moment().format(`YYYYMMDDHHmmss`)
    const filepath = `db/migrate/${timestamp}-create-${dreamName.hyphenize().pluralize()}.js`

    await File.write(config.pathTo(filepath), migrationTemplate(dreamName, keyField, passwordField))
    l.log(`wrote new migration to: ${filepath}`)
  }

  async _addRoute(dreamName) {
    const newRoutes = await addRoutes(dreamName)
    await File.write(config.routesPath + '.js', newRoutes)
    l.log(`wrote new route to: ${config.routesPath}.js`)
  }

  async _generateSpec(dreamName) {
    const filepath = `spec/dreams/${dreamName.hyphenize()}.spec.js`

    if (await File.exists(config.pathTo(filepath))) {
      l.log(`Did not write to ${filepath} since it already exists...`, { level: 'warning' })
    } else {
      await File.write(config.pathTo(filepath), specTemplate(dreamName))
      l.log(`wrote new spec to: ${filepath}`)
    }
  }

  async _generateSignInComponent(dreamName, keyField, passwordField) {
    return GenerateSignInComponent.generate(dreamName, keyField, passwordField)
  }
}

function migrationTemplate(name, keyField, passwordField) {
  const pluralizedName = name.snakeify().pluralize()

  return (
`\
export async function up(m) {
  await m.createTable('${pluralizedName}', t => {
    t.string('${keyField}')
    t.string('${passwordField}')
    t.timestamps()
  })
}

export async function down(m) {
  await m.dropTable('${pluralizedName}')
}
`
  )
}

function channelTemplate(name, keyField, passwordField) {
  return (
`\
import { Channel } from 'psychic'

export default class ${name.pascalize().pluralize()} extends Channel {
  initialize() {
    this
      .authenticates('${keyField}', '${passwordField}')
  }
}
`
  )
}


function dreamTemplate(name, keyField, passwordField) {
  return (
`\
import { Dream } from 'psychic'

export default class ${name.pascalize()} extends Dream {
  static {
    this
      .authenticates('${keyField}', '${passwordField}')
  }
}
`
  )
}

function specTemplate(name) {
  return (
`\
import ${name.pascalize()} from 'app/dreams/${name.hyphenize()}'

describe ('${name.pascalize()}', () => {
})
`
  )
}

async function addRoutes(name) {
  const routeFile = await File.read(config.routesPath + '.js')
  const lines = routeFile.toString().split("\n")

  const authRoutes = [
    `r.post('${name.pluralize()}', '${name.pluralize()}#create')`,
    `r.post('auth', '${name.pluralize()}#auth')`,
    `r.delete('auth', '${name.pluralize()}#signout')`,
  ]

  authRoutes.forEach(line => {
    lines.insertBefore('}', `  ${line}`)
  })

  return lines.join("\n")
}


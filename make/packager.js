import fs from 'fs'
import pascalCase from './helpers/pascalCase'
import snakeCase from './helpers/snakeCase'

class Packager {
  constructor({ prefix, originalPathPrefix, appDir }={}) {
    this.prefix = prefix || ''
    this.originalPathPrefix = originalPathPrefix || null
    this.appDir = appDir || 'app/'
  }

  packageChannels() {
    let imports = ''
    let finalExport = 'const channels = {'
    const originalPath = `${this.originalPathPrefix || this.prefix}app/channels`
    const channelsPath = `${this.prefix}app/channels`

    fs.readdirSync(originalPath).forEach(async (file, index) => {
      if (file === '.gitkeep') return
      imports += `import * as channel${index} from '${channelsPath}/${file}'\n`
      finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": channel${index},`
    })
    finalExport += '\n}\nexport default channels'
    fs.writeFileSync(`${this.appDir}pkg/channels.pkg.js`, imports + finalExport)
  }

  packageDreams() {
    let imports = ''
    let finalExport = 'const dreams = {'
    const originalPath = `${this.originalPathPrefix || this.prefix}app/dreams`
    const dreamsPath = `${this.prefix}app/dreams`

    fs.readdirSync(originalPath).forEach(async (file, index) => {
      if (file === '.gitkeep') return
      imports += `import * as dream${index} from '${dreamsPath}/${file}'\n`
      finalExport += `\n  "${snakeCase(file.replace(/\.js$/, ''))}": dream${index},`
    })
    finalExport += '\n}\nexport default dreams'
    fs.writeFileSync(`${this.appDir}pkg/dreams.pkg.js`, imports + finalExport)
  }

  packageMigrations() {
    let imports = ''
    let finalExport = 'const migrations = {'
    const originalPath = `${this.originalPathPrefix || this.prefix}db/migrate`
    const migrationsPath = `${this.prefix}db/migrate`

    fs.readdirSync(originalPath).forEach(async (file, index) => {
      imports += `import * as module${index} from '${migrationsPath}/${file}'\n`
      finalExport += `\n  "${file}": module${index},`
    })
    finalExport += '\n}\nexport default migrations'
    fs.writeFileSync(`${this.appDir}pkg/migrations.pkg.js`, imports + finalExport)
  }

  packageProjections() {
    let imports = ''
    let finalExport = 'const projections = {'
    const originalPath = `${this.originalPathPrefix || this.prefix}/app/projections`
    const channelsPath = `${this.prefix}/app/projections`

    fs.readdirSync(originalPath).forEach(async (file, index) => {
      if (file === '.gitkeep') return
      imports += `import * as projection${index} from '${channelsPath}/${file}'\n`
      finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": projection${index},`
    })
    finalExport += '\n}\nexport default projections'
    fs.writeFileSync(`${this.appDir}pkg/projections.pkg.js`, imports + finalExport)
  }

  packageREPL() {
    let imports = ''
    let globals = ''
    const originalPath = `${this.originalPathPrefix || this.prefix}/app/dreams`
    const dreamsPath = `${this.prefix}/app/dreams`

    fs.readdirSync(originalPath).forEach(async file => {
      if (file === '.gitkeep') return
      const className = pascalCase(file.replace(/\.js$/, ''))
      imports += `import ${className} from '${dreamsPath}/${file}'\n`
      globals += `global.${className} = ${className}\n`
    })
    fs.writeFileSync(`${this.appDir}pkg/repl.pkg.js`, imports + globals)
  }

  run() {
    // TODO: asyncify
    this.packageMigrations()
    this.packageDreams()
    this.packageChannels()
    this.packageProjections()
    this.packageREPL()
  }
}

export default Packager

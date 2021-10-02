const fs = require('fs')

function snakeCase(str) {
  return str
    .replace(/-/g, '_')
    .replace(/(?:^|\.?)([A-Z])/g, (_, y) =>
      "_" + y.toLowerCase()
    )
    .replace(/^_/, "")
}

function pascalCase(string) {
  return `${string}`
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w+)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`
    )
    .replace(new RegExp(/\s/, 'g'), '')
    .replace(new RegExp(/\w/), s => s.toUpperCase());
}

function packageMigrations() {
  let imports = ''
  let finalExport = 'const migrations = {'
  const migrationsPath = 'db/migrate'

  fs.readdirSync(migrationsPath).forEach(async (file, index) => {
    const isJSFile = /\.js$/.test(file)
    if (!isJSFile) return

    imports += `import * as module${index} from '${migrationsPath}/${file}'\n`
    finalExport += `\n  "${file}": module${index},`
  })
  finalExport += '\n}\nexport default migrations'
  fs.writeFileSync('app/pkg/migrations.pkg.js', imports + finalExport)
}

function packageDreams() {
  let imports = ''
  let finalExport = 'const dreams = {'

  fs.readdirSync('app/dreams').forEach(async (file, index) => {
    const isJSFile = /\.js$/.test(file)
    if (!isJSFile) return

    imports += `import * as dream${index} from 'app/dreams/${file}'\n`
    finalExport += `\n  "${snakeCase(file.replace(/\.js$/, ''))}": dream${index},`
  })
  finalExport += '\n}\nexport default dreams'
  fs.writeFileSync(`app/pkg/dreams.pkg.js`, imports + finalExport)
}

function packageChannels() {
  let imports = ''
  let finalExport = 'const channels = {'
  const channelsPath = 'app/channels'

  fs.readdirSync(channelsPath).forEach(async (file, index) => {
    const isJSFile = /\.js$/.test(file)
    if (!isJSFile) return

    imports += `import * as channel${index} from '${channelsPath}/${file}'\n`
    finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": channel${index},`
  })
  finalExport += '\n}\nexport default channels'
  fs.writeFileSync(`app/pkg/channels.pkg.js`, imports + finalExport)
}

function packageProjections() {
  let imports = ''
  let finalExport = 'const projections = {'
  const channelsPath = 'app/projections'

  fs.readdirSync(channelsPath).forEach(async (file, index) => {
    const isJSFile = /\.js$/.test(file)
    if (!isJSFile) return

    imports += `import * as projection${index} from '${channelsPath}/${file}'\n`
    finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": projection${index},`
  })
  finalExport += '\n}\nexport default projections'
  fs.writeFileSync(`app/pkg/projections.pkg.js`, imports + finalExport)
}

function packageREPL() {
  let imports = ''
  let globals = ''
  const dreamsPath = 'app/dreams'
  fs.readdirSync(dreamsPath).forEach(async file => {
    const isJSFile = /\.js$/.test(file)
    if (!isJSFile) return

    const className = pascalCase(file.replace(/\.js$/, ''))
    imports += `import ${className} from '${dreamsPath}/${file}'\n`
    globals += `global.${className} = ${className}\n`
  })
  fs.writeFileSync('app/pkg/repl.pkg.js', imports + globals)
}

if (!fs.existsSync('app/pkg'))
  fs.mkdirSync('app/pkg')

packageMigrations()
packageDreams()
packageChannels()
packageProjections()
packageREPL()


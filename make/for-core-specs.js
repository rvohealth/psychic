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
  const originalPath = 'spec/support/testapp/db/migrate'
  const migrationsPath = 'dist/db/migrate'

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    imports += `import * as module${index} from '${migrationsPath}/${file}'\n`
    finalExport += `\n  "${file}": module${index},`
  })
  finalExport += '\n}\nexport default migrations'
  fs.writeFileSync('src/pkg/migrations.pkg.js', imports + finalExport)
}

function packageDreams() {
  let imports = ''
  let finalExport = 'const dreams = {'
  const originalPath = 'spec/support/testapp/app/dreams'
  const dreamsPath = 'dist/app/dreams'

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    imports += `import * as dream${index} from '${dreamsPath}/${file}'\n`
    finalExport += `\n  "${snakeCase(file.replace(/\.js$/, ''))}": dream${index},`
  })
  finalExport += '\n}\nexport default dreams'
  fs.writeFileSync('src/pkg/dreams.pkg.js', imports + finalExport)
}

function packageChannels() {
  let imports = ''
  let finalExport = 'const channels = {'
  const originalPath = 'spec/support/testapp/app/channels'
  const channelsPath = 'dist/app/channels'

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    imports += `import * as channel${index} from '${channelsPath}/${file}'\n`
    finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": channel${index},`
  })
  finalExport += '\n}\nexport default channels'
  fs.writeFileSync('src/pkg/channels.pkg.js', imports + finalExport)
}

function packageProjections() {
  let imports = ''
  let finalExport = 'const projections = {'
  const originalPath = 'spec/support/testapp/app/projections'
  const channelsPath = 'dist/app/projections'

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    imports += `import * as projection${index} from '${channelsPath}/${file}'\n`
    finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": projection${index},`
  })
  finalExport += '\n}\nexport default projections'
  fs.writeFileSync(`src/pkg/projections.pkg.js`, imports + finalExport)
}

function packageREPL() {
  let imports = ''
  let globals = ''
  const originalPath = 'spec/support/testapp/app/dreams'
  const dreamsPath = 'dist/app/dreams'

  fs.readdirSync(dreamsPath).forEach(async file => {
    const className = pascalCase(file.replace(/\.js$/, ''))
    imports += `import ${className} from '${dreamsPath}/${file}'\n`
    globals += `global.${className} = ${className}\n`
  })
  fs.writeFileSync('src/pkg/repl.pkg.js', imports + globals)
}

packageMigrations()
packageDreams()
packageChannels()
packageProjections()
packageREPL()


import fs from 'fs'
import packageMigrations from './packageMigrations'
import packageDreams from './packageDreams'
import packageChannels from './packageChannels'
import packageProjections from './packageProjections'
import packageREPL from './packageREPL'

// function packageMigrations() {
//   let imports = ''
//   let finalExport = 'const migrations = {'
//   const originalPath = 'spec/support/testapp/db/migrate'
//   const migrationsPath = 'dist/testapp/db/migrate'

//   fs.readdirSync(originalPath).forEach(async (file, index) => {
//     const isJSFile = /\.js$/.test(file)
//     if (!isJSFile) return

//     imports += `import * as module${index} from '${migrationsPath}/${file}'\n`
//     finalExport += `\n  "${file}": module${index},`
//   })
//   finalExport += '\n}\nexport default migrations'
//   fs.writeFileSync('spec/support/testapp/app/pkg/migrations.pkg.js', imports + finalExport)
// }

// function packageDreams() {
//   let imports = ''
//   let finalExport = 'const dreams = {'
//   const originalPath = 'spec/support/testapp/app/dreams'
//   const dreamsPath = 'dist/testapp/app/dreams'

//   fs.readdirSync(originalPath).forEach(async (file, index) => {
//     const isJSFile = /\.js$/.test(file)
//     if (!isJSFile) return

//     imports += `import * as dream${index} from '${dreamsPath}/${file}'\n`
//     finalExport += `\n  "${snakeCase(file.replace(/\.js$/, ''))}": dream${index},`
//   })
//   finalExport += '\n}\nexport default dreams'
//   fs.writeFileSync('spec/support/testapp/app/pkg/dreams.pkg.js', imports + finalExport)
// }

// function packageChannels() {
//   let imports = ''
//   let finalExport = 'const channels = {'
//   const originalPath = 'spec/support/testapp/app/channels'
//   const channelsPath = 'dist/testapp/app/channels'

//   fs.readdirSync(originalPath).forEach(async (file, index) => {
//     const isJSFile = /\.js$/.test(file)
//     if (!isJSFile) return

//     imports += `import * as channel${index} from '${channelsPath}/${file}'\n`
//     finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": channel${index},`
//   })
//   finalExport += '\n}\nexport default channels'
//   fs.writeFileSync('spec/support/testapp/app/pkg/channels.pkg.js', imports + finalExport)
// }

// function packageProjections() {
//   let imports = ''
//   let finalExport = 'const projections = {'
//   const originalPath = 'spec/support/testapp/app/projections'
//   const channelsPath = 'dist/app/projections'

//   fs.readdirSync(originalPath).forEach(async (file, index) => {
//     const isJSFile = /\.js$/.test(file)
//     if (!isJSFile) return

//     imports += `import * as projection${index} from '${channelsPath}/${file}'\n`
//     finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": projection${index},`
//   })
//   finalExport += '\n}\nexport default projections'
//   fs.writeFileSync(`spec/support/testapp/app/pkg/projections.pkg.js`, imports + finalExport)
// }

// function packageREPL() {
//   let imports = ''
//   let globals = ''
//   const originalPath = 'spec/support/testapp/app/dreams'
//   const dreamsPath = 'dist/app/dreams'

//   fs.readdirSync(originalPath).forEach(async file => {
//     const isJSFile = /\.js$/.test(file)
//     if (!isJSFile) return

//     const className = pascalCase(file.replace(/\.js$/, ''))
//     imports += `import ${className} from '${dreamsPath}/${file}'\n`
//     globals += `global.${className} = ${className}\n`
//   })
//   fs.writeFileSync('spec/support/testapp/app/pkg/repl.pkg.js', imports + globals)
// }

packageMigrations('dist/testapp/', 'spec/support/testapp/')
packageDreams('dist/testapp/', 'spec/support/testapp/')
packageChannels('dist/testapp/', 'spec/support/testapp/')
packageProjections('dist/testapp/', 'spec/support/testapp/')
packageREPL('dist/testapp/', 'spec/support/testapp/')


import fs from 'fs'

function packageMigrations(prefix='', originalPathPrefix=null) {
  let imports = ''
  let finalExport = 'const migrations = {'
  const originalPath = `${originalPathPrefix || prefix}db/migrate`
  const migrationsPath = `${prefix}db/migrate`
//   const dreamsPath = 'dist/app/dreams'

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    imports += `import * as module${index} from '${migrationsPath}/${file}'\n`
    finalExport += `\n  "${file}": module${index},`
  })
  finalExport += '\n}\nexport default migrations'
  fs.writeFileSync('src/pkg/migrations.pkg.js', imports + finalExport)
}

export default packageMigrations

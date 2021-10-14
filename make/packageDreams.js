import fs from 'fs'
import snakeCase from './helpers/snakeCase'

function packageDreams(prefix='', originalPathPrefix=null) {
  let imports = ''
  let finalExport = 'const dreams = {'
  const originalPath = `${originalPathPrefix || prefix}app/dreams`
  const dreamsPath = `${prefix}app/dreams`

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    if (file === '.gitkeep') return
    imports += `import * as dream${index} from '${dreamsPath}/${file}'\n`
    finalExport += `\n  "${snakeCase(file.replace(/\.js$/, ''))}": dream${index},`
  })
  finalExport += '\n}\nexport default dreams'
  fs.writeFileSync('src/pkg/dreams.pkg.js', imports + finalExport)
}

export default packageDreams

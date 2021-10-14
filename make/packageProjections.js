import fs from 'fs'
import pascalCase from './helpers/pascalCase'

function packageProjections(prefix='', originalPathPrefix=null) {
  let imports = ''
  let finalExport = 'const projections = {'
  const originalPath = `${originalPathPrefix || prefix}/app/projections`
  const channelsPath = `${prefix}/app/projections`

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    if (file === '.gitkeep') return
    imports += `import * as projection${index} from '${channelsPath}/${file}'\n`
    finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": projection${index},`
  })
  finalExport += '\n}\nexport default projections'
  fs.writeFileSync(`src/pkg/projections.pkg.js`, imports + finalExport)
}

export default packageProjections

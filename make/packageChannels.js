import fs from 'fs'
import pascalCase from './helpers/pascalCase'

function packageChannels(prefix='', originalPathPrefix=null) {
  let imports = ''
  let finalExport = 'const channels = {'
  const originalPath = `${originalPathPrefix || prefix}app/channels`
  const channelsPath = `${prefix}app/channels`

  fs.readdirSync(originalPath).forEach(async (file, index) => {
    if (file === '.gitkeep') return
    imports += `import * as channel${index} from '${channelsPath}/${file}'\n`
    finalExport += `\n  "${pascalCase(file.replace(/\.js$/, ''))}": channel${index},`
  })
  finalExport += '\n}\nexport default channels'
  fs.writeFileSync('src/pkg/channels.pkg.js', imports + finalExport)
}

export default packageChannels

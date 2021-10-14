import fs from 'fs'
import pascalCase from './helpers/pascalCase'

function packageREPL(prefix='', originalPathPrefix=null) {
  let imports = ''
  let globals = ''
  const originalPath = `${originalPathPrefix || prefix}/app/dreams`
  const dreamsPath = `${prefix}/app/dreams`

  fs.readdirSync(originalPath).forEach(async file => {
    if (file === '.gitkeep') return
    const className = pascalCase(file.replace(/\.js$/, ''))
    imports += `import ${className} from '${dreamsPath}/${file}'\n`
    globals += `global.${className} = ${className}\n`
  })
  fs.writeFileSync('src/pkg/repl.pkg.js', imports + globals)
}

export default packageREPL

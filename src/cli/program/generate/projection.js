import l from 'src/singletons/l'
import File from 'src/helpers/file'

export default class GenerateProjection {
  async generate(args) {
    const [ projectionName ] = args
    const filepath = `app/projections/${projectionName.hyphenize()}.js`

    await File.mkdirUnlessExists('app/projections')
    await File.write(filepath, projectionTemplate(projectionName))

    if (!process.env.CORE_TEST) {
      l.log(`wrote projection to: ${filepath}`)
      return process.exit()
    }
  }
}

function projectionTemplate(projectionName) {
  return (
`
import { Projection } from 'psychic'

export default class ${projectionName.pascalize()}Projection extends Projection {
}
`
  )
}

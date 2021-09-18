import l from 'src/singletons/l'
import File from 'src/helpers/file'

export default class GenerateDream {
  async generate(args) {
    const [ channelName ] = args
    const filepath = `app/channels/${channelName}.js`

    await File.write(filepath, channelTemplate(channelName))

    if (!process.env.CORE_TEST) {
      l.log(`wrote channel to: ${filepath}`)
      return process.exit()
    }
  }
}

function channelTemplate(channelName) {
  return (
`
import { Channel } from 'psychic'

export default class ${channelName.capitalize()}Channel extends Channel {
}
`
  )
}

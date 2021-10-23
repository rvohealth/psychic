import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const template =
`\
import { Channel } from 'psychic'

export default class FishmanChannel extends Channel {
}
`

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:channel <name>', () => {
  it ('generates a new channel in the channels folder with the passed name', async () => {
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'channel', args: ['fishman'] })
    expect(File.write).toHaveBeenCalledWith('app/channels/fishman.js', template)
  })
})

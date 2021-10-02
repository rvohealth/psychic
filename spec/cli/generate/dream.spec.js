import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()


describe('cli program g:migration <name>', () => {
  it ('generates a new file in the dreams folder with the passed name', async () => {
    const template =
`\
import psychic, { Dream } from 'psychic'

export default class Fishman extends Dream {
}
`

    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'dream', args: ['fishman'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('app/dreams/fishman.js'), template)
  })

  it ('generates a new file in the migrations folder with the passed name', async () => {
    const template =
`\
export async function up(m) {
  await m.createTable('fishman', t => {

  })
}

export async function down(m) {
  await m.dropTable('fishman')
}
`

    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'dream', args: ['fishman'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-fishman.js'), template.toString())
  })

  context ('when text attributes are passed', () => {
    it ('adds them to template', async () => {
      const template =
`\
export async function up(m) {
  await m.createTable('fishman', t => {
    t.text('snapman')
    t.text('fishman')
  })
}

export async function down(m) {
  await m.dropTable('fishman')
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'dream', args: ['fishman', 'text:snapman', 'text:fishman'] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-fishman.js'), template.toString())
    })
  })
})

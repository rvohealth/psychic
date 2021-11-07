import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()


describe('cli program g:migration <name> belongsto:<association>', () => {
  it ('initializes dream with associations', async () => {
    const template =
`\
import { Dream } from 'psychic'

export default class Comment extends Dream {
  static {
    this
      .belongsTo('user')
      .hasOne('post')
      .hasMany('replies')
  }
}
`

    File.write = eavesdrop()
    await generateCLIProgram.run({
      command: 'dream',
      args: [
        'comment',
        'belongsto:user',
        'hasone:post',
        'hasmany:replies',
      ]
    })
    expect(File.write).toHaveBeenCalledWith('app/dreams/comment.js', template)
  })

  it ('generates a new file in the migrations folder with the passed name', async () => {
    const template =
`\
export async function change(m) {
  await m.createTable('comments', t => {
    t.belongsTo('user')
    t.timestamps()
  })
}
`

    File.write = eavesdrop()
    await generateCLIProgram.run({
      command: 'dream',
      args: [
        'comments',
        'belongsto:user',
        'hasone:post',
        'hasmany:boys',
      ]
    })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-comments.js'), template.toString())
  })
})


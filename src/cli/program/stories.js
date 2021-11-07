import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

export default class StoriesCLIProgram extends CLIProgram {
  async run(args) {
    return await this.stories(args.args)
  }

  async stories(args) {
    if (args?.length)
      await spawn(`yarn run stories ${args.join(' ')} --forceExit`, [], { shell: true, stdio: 'inherit' })

    else {
      const hasStoriesDir = await Dir.isDir('spec/stories')
      const hasStories = await Dir.isEmpty('spec/stories')
      if (!hasStoriesDir || !hasStories) return

      await spawn(`yarn run stories spec/stories --forceExit`, [], { shell: true, stdio: 'inherit' })
    }
  }
}

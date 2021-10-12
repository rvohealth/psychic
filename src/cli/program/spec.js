import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

export default class SpecCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.spec(args.args)
    throw `unhandled command ${args.command}`
  }

  async spec(args) {
    if (args?.length)
      await spawn(`yarn test ${args.join(' ')} --forceExit`, [], { shell: true, stdio: 'inherit' })

    else {
      for (const folder of await Dir.readdir('spec')) {
        if (folder === 'features') continue

        const isDir = await Dir.isDir(`spec/${folder}`)
        const isEmpty = await Dir.isEmpty(`spec/${folder}`)
        if (isDir && !isEmpty)
          await spawn(`yarn test ./spec/${folder} --forceExit`, [], { shell: true, stdio: 'inherit' })
      }

      const hasStoriesDir = await Dir.isDir('spec/stories')
      const hasStories = await Dir.isEmpty('spec/stories')

      if (!hasStoriesDir || !hasStories) return

      await spawn(`yarn run psy spec/stories --forceExit`, [], { shell: true, stdio: 'inherit' })
    }
  }
}

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
      let command = 'test'
      for (const folder of await Dir.readdir('spec', { onlyDirs: true, ignoreHidden: true })) {
        if (folder === 'features') continue

        const isEmpty = await Dir.isEmpty(`spec/${folder}`, { ignoreHidden: true })
        if (!isEmpty) {
          await spawn(`yarn ${command} ./spec/${folder} --forceExit`, [], { shell: true, stdio: 'inherit' })
          command = 'testquickly'
        }
      }

      const files = await Dir.readdir('spec', { onlyFiles: true, ignoreHidden: true })
      const specFiles = files
        .filter(file => /\.spec\.js$/.test(file))
        .map(file => `spec/${file}`)

      if (specFiles.length > 0)
        await spawn(
          `yarn ${command} --findRelatedTests ${specFiles.join(' ')} --forceExit`,
          [],
          { shell: true, stdio: 'inherit' }
        )

      const hasStoriesDir = await Dir.isDir('spec/stories')
      const hasStories = await Dir.isEmpty('spec/stories')

      if (!hasStoriesDir || !hasStories) return

      await spawn(`yarn run psy spec/stories --forceExit`, [], { shell: true, stdio: 'inherit' })
    }
  }
}

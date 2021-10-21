import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

export default class SpecCLIProgram extends CLIProgram {
  constructor() {
    super()
    this._testCommand = 'test'
  }

  async run(args) {
    if (args.command === null) return await this.spec(args.args)
    throw `unhandled command ${args.command}`
  }

  async spec(args) {
    if (args?.length)
      await spawn(`yarn test ${args.join(' ')} --forceExit`, [], { shell: true, stdio: 'inherit' })

    else {
      await this.#runForDir('spec')
      await this.#runForDir('spec/db', { bypassIgnore: true })
      await this.#runForDir('spec/dream', { bypassIgnore: true })

      const files = await Dir.readdir('spec', { onlyFiles: true, ignoreHidden: true })
      const specFiles = files
        .filter(file => /\.spec\.js$/.test(file))
        .map(file => `spec/${file}`)

      if (specFiles.length > 0)
        await spawn(
          `yarn ${this._testCommand} --findRelatedTests ${specFiles.join(' ')} --forceExit`,
          [],
          { shell: true, stdio: 'inherit' }
        )

      const hasStoriesDir = await Dir.isDir('spec/stories')
      const hasStories = await Dir.isEmpty('spec/stories')

      if (!hasStoriesDir || !hasStories) return

      await spawn(`yarn run psy spec/stories --forceExit`, [], { shell: true, stdio: 'inherit' })
    }
  }

  async #runForDir(path, { bypassIgnore }={}) {
    const dirIgnoreList = ['features', 'db', 'dream', 'support', 'factories']
    for (const folder of await Dir.readdir(path, { onlyDirs: true, ignoreHidden: true })) {
      if (dirIgnoreList.includes(folder) && !bypassIgnore) continue

      const isEmpty = await Dir.isEmpty(`${folder}`, { ignoreHidden: true })
      if (!isEmpty) {
        await spawn(`yarn ${this._testCommand} ./${folder}/* --forceExit`, [], { shell: true, stdio: 'inherit' })
        this._testCommand = 'testquickly'
      }
    }
  }
}

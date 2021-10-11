import File from 'src/helpers/file'
import CLIProgram from 'src/cli/program'
import l from 'src/singletons/l'
import exec from 'src/helpers/exec'

export default class NewAppProgram extends CLIProgram {
  async run(args) {
    if (args.command === 'app' || typeof args.command === 'string')
      return await this.new(args)

    throw `unhandled command ${args.command}`
  }

  async new(args) {
    const path = `../` + (args.args[0] || 'black-cat')
    const quick = args.args[1] === 'quick'
    const fromScratch = !(await File.exists(path))

    if (fromScratch) {
      l.logStatus('running npx create-react-app (this may take a while)...')
      await exec(`npx create-react-app ${path} --template redux --silent`)
    }

    l.logStatus('build psychic foundation...')
    await this.buildPsychicAppFoundation(path)

    l.logStatus('add custom npm scripts to package.json...')
    const psychicPkgjson = JSON.parse((await File.read('./package.json')))
    const pkgjson = JSON.parse((await File.read(path + '/package.json')))

    pkgjson.dependencies = {
      ...pkgjson.dependencies,
      ...psychicPkgjson.dependencies,
      psychic: 'git+ssh://git@github.com/avocadojesus/psychic.git#dev',
    }

    pkgjson.devDependencies = {
      ...pkgjson.devDependencies,
      ...psychicPkgjson.devDependencies,
    }

    pkgjson.main = 'node_modules/psychic/dist/index.js'

    pkgjson.scripts.psy = "NODE_PATH=. node ./dist/bin/psy.js"

    pkgjson.scripts.trance = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "NODE_PATH=. node -i --experimental-repl-await -e 'require(\"./node_modules/psychic/dist/boot/app/repl.js\")'"

    pkgjson.scripts.prepare = "NODE_PATH=. npm run psybuild"

    pkgjson.scripts.psybuild = "NODE_PATH=./node_modules/psychic/ node ./node_modules/psychic/make/for-app.js && " +
      "NODE_PATH=. ./node_modules/.bin/babel app -d dist/app --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel db -d dist/db --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel config -d dist/config --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel bin -d dist/bin --copy-files &&" +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel app -d dist/app --copy-files && " +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel config -d dist/config --copy-files && " +
      "./node_modules/psychic/node_modules/.bin/babel app -d dist/app --copy-files &&" +
      "./node_modules/psychic/node_modules/.bin/babel config -d dist/config --copy-files"

    // pkgjson.scripts.buildspec = "NODE_PATH=. node ./make/for-core-specs.js && NODE_PATH=. ./node_modules/.bin/babel src -d dist --copy-files && NODE_PATH=. ./node_modules/.bin/babel spec/support/testapp -d dist/testapp --copy-files"
    pkgjson.scripts.buildspec = "NODE_PATH=. ./node_modules/.bin/babel src -d dist --copy-files && NODE_PATH=. ./node_modules/.bin/babel app -d dist/app --copy-files"

    pkgjson.scripts.test = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "npm run buildspec && NODE_PATH=. node --experimental-vm-modules ./node_modules/.bin/jest --config ./jest.config.json --runInBand --detectOpenHandles"

    await File.write(path + '/package.json', JSON.stringify(pkgjson, null, 2))

    if (!quick || fromScratch) {
      l.logStatus('adding eslint, babel-eslint...')
      await exec(`cd ${path} && yarn add babel-eslint eslint-config-react-app babel-plugin-module-resolver -D`)

      l.logStatus('adding non-dev dependencies...')
      await exec(`cd ${path} && yarn add axios socket.io-client --silent`)

      l.logStatus('installing yarn dependencies...', { level: 'warn' })
      await exec(`cd ${path} && yarn install --silent`)
    }

    // if ((await File.exists(path + '/node_modules/psychic'))) {
    //   l.logStatus('selectively copy src and make folder...')
    //   await File.copy('./src', path + '/node_modules/psychic/src')
    //   await File.copy('./make', path + '/node_modules/psychic/make')

    //   l.logStatus('build current app...')
    //   await exec('yarn run build')

    //   l.logStatus('copy rebuilt dist folder...')
    //   await File.copy('./dist', path + '/node_modules/psychic/dist')

    // } else {
    //   l.logStatus('copy psychic app to node_modules (temporarily, until we have npm up and running)...')
    //   await File.copy('./', path + '/node_modules/psychic')
    // }

    // if (!quick || fromScratch) {
    l.logStatus('installing deps...')
    await exec(`cd ${path}/node_modules/psychic && yarn install --silent`)
    // }

    l.logStatus('copying .babelrc...')

    l.logStatus('updating gitignore...')
    await File.append(`${path}/.gitignore`, "\n# psychic")
    await File.append(`${path}/.gitignore`, "\n/dist")
    await File.append(`${path}/.gitignore`, "\n/app/pkg")

    l.logStatus('Done building app!')
    l.end()
  }

  async buildPsychicAppFoundation(path) {
    if (!(await File.exists(path + '/app'))) {
      l.logStatus('carve out new app structure...')
      await File.copy('src/template', path)

      l.logStatus('copy and remove js folder')
      await File.copy(path + '/js', path + '/src/')
      await File.rm(`${path}/js`)

    } else {
      l.logStatus('hot swap app folder...')
      File.replace('src/template/app', path + '/app')

      l.logStatus('hot swap config folder...')
      File.replace('src/template/config/database.yml', path + '/config/database.yml')
      File.replace('src/template/config/messages.yml', path + '/config/messages.yml')
      File.replace('src/template/config/redis.yml', path + '/config/redis.yml')

      // only replace schema if not there, so don't have to rerun migrations
      if (!(await File.exists('src/template/config/schema.json')))
        File.replace('src/template/config/schema.json', path + '/config/schema.json')

      l.logStatus('copy App.js')
      await File.copy('src/template/js/App.js', path + '/src/App.js')

      l.logStatus('copy template/js/psy to src/psy...')
      await File.copy('src/template/js/psy', path + '/src/psy')
    }
  }
}

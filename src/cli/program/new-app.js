import util from 'util'
import { exec } from 'child_process'
import {
  copyFile,
  readFile,
  writeFile,
} from 'fs/promises'
import fse from 'fs-extra'
import fileExists from 'src/helpers/file-exists'
import CLIProgram from 'src/cli/program'
import l from 'src/singletons/l'

const execp = util.promisify(exec)

export default class NewAppProgram extends CLIProgram {
  async run(args) {
    if (args.command === 'app' || typeof args.command === 'string')
      return await this.new(args)

    throw `unhandled command ${args.command}`
  }

  async new(args) {
    const path = `../` + (args.args[0] || 'black-cat')
    const quick = args.args[1] === 'quick'
    const fromScratch = !(await fileExists(path))

    if (fromScratch) {
      l.logStatus('running npx create-react-app (this may take a while)...')
      await execp(`npx create-react-app ${path} --template redux --silent`)
    }

    l.logStatus('build psychic foundation...')
    this.buildPsychicAppFoundation(path)

    l.logStatus('add custom npm scripts to package.json...')
    const psychicPkgjson = JSON.parse(await readFile('./package.json'))
    const pkgjson = JSON.parse(await readFile(path + '/package.json'))

    pkgjson.dependencies = {
      ...pkgjson.dependencies,
      ...psychicPkgjson.dependencies,
    }

    pkgjson.devDependencies = {
      ...pkgjson.devDependencies,
      ...psychicPkgjson.devDependencies,
    }

    pkgjson.main = 'node_modules/psychic/dist/index.js'

    pkgjson.scripts.psy = "NODE_PATH=. npm run psybuild --scripts-prepend-node-path --silent && " +
      "clear && " +
      "NODE_PATH=. node ./dist/bin/psy.js"

    pkgjson.scripts.trance = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "NODE_PATH=. node -i --experimental-repl-await -e 'require(\"./node_modules/psychic/dist/boot/app/repl.js\")'"

    pkgjson.scripts.psybuild = "NODE_PATH=./node_modules/psychic/ node ./node_modules/psychic/make/for-app.js && " +
      "NODE_PATH=. ./node_modules/.bin/babel app -d dist/app --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel db -d dist/db --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel config -d dist/config --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel bin -d dist/bin --copy-files &&" +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel app -d dist/app --copy-files && " +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel config -d dist/config --copy-files && " +
      "./node_modules/psychic/node_modules/.bin/babel app -d dist/app --copy-files &&" +
      "./node_modules/psychic/node_modules/.bin/babel config -d dist/config --copy-files"

    await writeFile(path + '/package.json', JSON.stringify(pkgjson, null, 2))

    if (!quick || fromScratch) {
      l.logStatus('adding eslint, babel-eslint...')
      await execp(`cd ${path} && yarn add babel-eslint eslint-config-react-app -D`)

      l.logStatus('adding non-dev dependencies...')
      await execp(`cd ${path} && yarn add axios socket.io-client --silent`)

      l.logStatus('installing yarn dependencies...', { level: 'warn' })
      await execp(`cd ${path} && yarn install --silent`)
    }

    if ((await fileExists(path + '/node_modules/psychic'))) {
      l.logStatus('selectively copy src and make folder...')
      await fse.copy('./src', path + '/node_modules/psychic/src')
      await fse.copy('./make', path + '/node_modules/psychic/make')

      l.logStatus('build current app...')
      await execp('yarn run build')

      l.logStatus('copy rebuilt dist folder...')
      await fse.copy('./dist', path + '/node_modules/psychic/dist')

    } else {
      l.logStatus('copy psychic app to node_modules (temporarily, until we have npm up and running)...')
      await fse.copy('./', path + '/node_modules/psychic')
    }

    if (!quick || fromScratch) {
      l.logStatus('installing deps...')
      await execp(`cd ${path}/node_modules/psychic && yarn install --silent`)
    }

    l.logStatus('copying .babelrc...')
    await copyFile('./.babelrc', path + '/.babelrc')

    l.logStatus('Done building app!')
    l.end()
  }

  async buildPsychicAppFoundation(path) {
    if (!(await fileExists(path + '/app'))) {
      l.logStatus('carve out new app structure...')
      await fse.copy('src/template', path)

      l.logStatus('copy and remove js folder')
      await fse.copy(path + '/js', path + '/src/')
      await fse.remove(`${path}/js`)

    } else {
      l.logStatus('hot swap app folder...')
      this.replaceFile('src/template/app', path + '/app')
    }
  }

  async replaceFile(file, newPath) {
    if ((await fileExists(newPath))) await execp('rm -rf ' + newPath)
    await fse.copy(file, newPath)
  }
}

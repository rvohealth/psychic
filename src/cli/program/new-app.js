import File from 'src/helpers/file'
import Dir from 'src/helpers/dir'
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
    l.logPermanently(" running psy generate:app...\n\n")

    const _path = args.args[0]
    if (!_path) throw "Must pass an app name when calling, i.e. psy new:app appname"
    const path = `${process.env.ORIGINAL_PWD}/${_path}`

    l.logStatus('copying react template to new path')
    await Dir.copy('template/create-react-app-template', path)
    // await exec(`npx create-react-app ${path} --template redux --silent`)

    l.logStatus('build psychic foundation...')
    await this.buildPsychicAppFoundation(path)

    l.logStatus('add custom npm scripts to package.json...')
    const psychicPkgjson = JSON.parse((await File.read('package.json')))
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

    pkgjson.main = 'node_modules/psychic/.dist/index.js'

    pkgjson.scripts.psy = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "NODE_PATH=. node ./.dist/bin/psy.js"

    pkgjson.scripts.trance = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "NODE_PATH=. node -i --experimental-repl-await -e 'require(\"./node_modules/psychic/.dist/psychic/boot/app/index.js\")'"

    pkgjson.scripts.prepare = null

    pkgjson.scripts.psybuild =
      "NODE_PATH=./node_modules/psychic/ node ./node_modules/psychic/.dist/make/for-app.js && " +
      "NODE_PATH=. ./node_modules/.bin/babel app -d .dist/app --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel db -d .dist/db --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel config -d .dist/config --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel bin -d .dist/bin --copy-files &&" +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel app -d .dist/app --copy-files && " +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel config -d .dist/config --copy-files && " +
      "./node_modules/psychic/node_modules/.bin/babel app -d .dist/app --copy-files &&" +
      "./node_modules/psychic/node_modules/.bin/babel config -d .dist/config --copy-files"

    // pkgjson.scripts.buildspec = "NODE_PATH=. node ./make/for-core-specs.js && NODE_PATH=. ./node_modules/.bin/babel src -d .dist --copy-files && NODE_PATH=. ./node_modules/.bin/babel spec/support/testapp -d .dist/testapp --copy-files"
    pkgjson.scripts.buildspec = "NODE_PATH=. ./node_modules/.bin/babel src -d .dist --copy-files && NODE_PATH=. ./node_modules/.bin/babel app -d .dist/app --copy-files"

    pkgjson.scripts.test = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "npm run buildspec && NODE_PATH=. node --experimental-vm-modules ./node_modules/.bin/jest --config ./jest.config.json --runInBand --detectOpenHandles"

    pkgjson.scripts.stories = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "npm run buildspec && NODE_PATH=. node --experimental-vm-modules ./node_modules/.bin/jest --config ./jest.stories.config.json --runInBand --detectOpenHandles"

    await File.write(path + '/package.json', JSON.stringify(pkgjson, null, 2))

    l.logStatus('installing yarn dependencies...', { level: 'warn' })
    await exec(`cd ${path} && yarn install --silent`)

    l.logStatus('adding eslint, babel-eslint...')
    await exec(`cd ${path} && yarn add babel-eslint eslint-config-react-app babel-plugin-module-resolver -D`)

    l.logStatus('adding non-dev dependencies...')
    await exec(`cd ${path} && yarn add axios socket.io-client --silent`)

    l.logStatus('installing yarn dependencies...', { level: 'warn' })
    await exec(`cd ${path} && yarn install --silent`)

    l.logStatus('installing psychic deps...', { level: 'warn' })
    await exec(`cd ${path}/node_modules/psychic && yarn install --silent`)

    l.logStatus('running psybuild...', { level: 'warn' })
    await exec(`cd ${path} && yarn run psybuild`)

    l.logStatus('Done building app!')
    l.end()
  }

  async buildPsychicAppFoundation(path) {
    l.logStatus('carve out new app structure...')
    await File.copy('src/psychic/template', path)
    await File.touch(
      `${path}/.env.development`,
`\
NODE_ENV=development
PSYCHIC_ENV=development
PSYCHIC_SECRET=development_secret_123
GMAIL_AUTH_USERNAME=youremail@gmail.com
GMAIL_AUTH_PASSWORD=yourgooglepassword
DB_NAME=yourdbname
DB_USERNAME=yourusername
DB_PASSWORD=yourpassword
`
    )

    await File.touch(
      `${path}/.env.test`,
`\
NODE_ENV=test
PSYCHIC_ENV=test
PSYCHIC_SECRET=test_secret_123
TWILIO_SMS_PHONE=1112223333
TWILIO_SID=ACabcde123834bdjhfgjhf83487jhasj27
TWILIO_AUTH_TOKEN=3bc462945eb4b7ec51d41803a1608f88
TWILIO_AUTH_TOKEN=asdjkfh9374jbf8348734jgfu3476477
GMAIL_AUTH_USERNAME=youremail@gmail.com
GMAIL_AUTH_PASSWORD=yourgooglepassword
DB_NAME=yourdbname_test
DB_USERNAME=yourusername
DB_PASSWORD=yourpassword
`
    )

    l.logStatus('copy and remove js folder')
    await File.copy(path + '/js', path + '/src/')
    await Dir.mkdir(`${path}/log`)
    await File.touch(`${path}/log/.gitkeep`)
    await File.rm(`${path}/js`)
  }
}

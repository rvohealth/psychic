import File from 'src/helpers/file'
import Dir from 'src/helpers/dir'
import CLIProgram from 'src/cli/program'
import l from 'src/singletons/l'
import exec from 'src/helpers/exec'
import PkgjsonBuilder from 'src/cli/program/new-app/pkgjson-builder'

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
    const path = `${process.env.ORIGINAL_PWD || '.'}/${_path}`
    const appName = _path.split('/').last
    console.log("APPNAME:", appName, _path)

    l.logStatus('copying react template to new path')
    await Dir.copy('template/create-react-app', path)
    // await exec(`npx create-react-app ${path} --template redux --silent`)

    l.logStatus('build psychic foundation...')
    await this.buildPsychicAppFoundation(path, appName)

    l.logStatus('add custom npm scripts to package.json...')
    await PkgjsonBuilder.write(path)

    l.logStatus('installing yarn dependencies...', { level: 'warn' })
    await exec(`cd ${path} && yarn install --silent`)

    l.logStatus('installing certain dev dependencies at latest versions...')
    const requiredDevDependencies = [
      'babel-eslint',
      'eslint-config-react-app',
      'babel-plugin-module-resolver',
    ]
    await exec(`cd ${path} && yarn add ${requiredDevDependencies.join(' ')} -D`)

    l.logStatus('installing certain dependencies at latest versions...')
    const requiredDependencies = [
      'axios',
      'socket.io-client',
      'react-router-dom',
    ]
    await exec(`cd ${path} && yarn add ${requiredDependencies.join(' ')} --silent`)

    l.logStatus('installing yarn dependencies...', { level: 'warn' })
    await exec(`cd ${path} && yarn install --silent`)

    l.logStatus('installing psychic deps...', { level: 'warn' })
    await exec(`cd ${path}/node_modules/psychic && yarn install --silent`)

    l.logStatus('running psybuild...', { level: 'warn' })
    await exec(`cd ${path} && yarn run psybuild`)

    l.logStatus('initializing git', { level: 'warn' })
    await exec(`cd ${path} && git init && git add --all && git commit -am "psy init"`)

    l.logStatus('Done building app!')
    l.end()
  }

  async buildPsychicAppFoundation(path, appName) {
    l.logStatus('carve out new app structure...')
    await File.copy('template/psychic-app', path)
    await File.touch(
      `${path}/.env.development`,
`\
SKIP_PREFLIGHT_CHECK=true
NODE_ENV=development
PSYCHIC_ENV=development
PSYCHIC_SECRET=development_secret_123
GMAIL_AUTH_USERNAME=youremail@gmail.com
GMAIL_AUTH_PASSWORD=yourgooglepassword
DB_NAME=${appName}
DB_USERNAME=yourusername
DB_PASSWORD=yourpassword
`
    )

    await File.touch(
      `${path}/.env.test`,
`\
SKIP_PREFLIGHT_CHECK=true
NODE_ENV=test
PSYCHIC_ENV=test
PSYCHIC_SECRET=test_secret_123
TWILIO_SMS_PHONE=1112223333
TWILIO_SID=ACabcde123834bdjhfgjhf83487jhasj27
TWILIO_AUTH_TOKEN=3bc462945eb4b7ec51d41803a1608f88
TWILIO_AUTH_TOKEN=asdjkfh9374jbf8348734jgfu3476477
GMAIL_AUTH_USERNAME=youremail@gmail.com
GMAIL_AUTH_PASSWORD=yourgooglepassword
DB_NAME=${appName}_test
DB_USERNAME=yourusername
DB_PASSWORD=yourpassword
`
    )

    l.logStatus('copy and remove js folder')
    await File.copy(path + '/js', path + '/src/')
    await File.rm(`${path}/js`)
  }
}

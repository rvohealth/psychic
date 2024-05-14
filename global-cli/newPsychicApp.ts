import * as fs from 'fs'
import * as c from 'colorette'

import copyRecursive from './helpers/copyRecursive'
import EnvBuilder from './file-builders/EnvBuilder'
import sspawn from './helpers/sspawn'
import logo from './helpers/logo'
import log from './helpers/log'
import sleep from './helpers/sleep'
import welcomeMessage from './helpers/welcomeMessage'
import gatherUserInput from './helpers/gatherUserInput'
import PackagejsonBuilder from './file-builders/PackagejsonBuilder'
import ViteConfBuilder from './file-builders/ViteConfBuilder'
import AppConfigBuilder from './file-builders/AppConfigBuilder'
import DreamYamlBuilder from './file-builders/DreamYamlBuilder'
import ESLintConfBuilder from './file-builders/EslintConfBuilder'

function testEnv() {
  return process.env.NODE_ENV === 'test'
}

export default async function newPsychicApp(appName: string, args: string[]) {
  const userOptions = await gatherUserInput(args)

  if (!testEnv()) {
    log.clear()
    log.write(logo() + '\n\n', { cache: true })
    log.write(c.green(`Installing psychic framework to ./${appName}`), { cache: true })
    log.write(c.green(`Step 1. writing boilerplate to ${appName}...`))
  }

  let projectPath: string
  const rootPath = `./${appName}`

  if (userOptions.apiOnly) {
    projectPath = `./${appName}`
    copyRecursive(__dirname + '/../boilerplate/api', `./${appName}`)
  } else {
    projectPath = `./${appName}/api`
    fs.mkdirSync(`./${appName}`)
    copyRecursive(__dirname + '/../boilerplate/api', projectPath)
  }

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true })
    log.write(c.green(`Step 2. building default config files...`))
  }

  fs.writeFileSync(`${projectPath}/.env`, EnvBuilder.build({ appName, env: 'development' }))
  fs.writeFileSync(`${projectPath}/.env.test`, EnvBuilder.build({ appName, env: 'test' }))
  fs.writeFileSync(projectPath + '/package.json', await PackagejsonBuilder.buildAPI(userOptions))
  fs.writeFileSync(`${projectPath}/src/conf/app.ts`, await AppConfigBuilder.build({ appName, userOptions }))
  fs.writeFileSync(projectPath + '/.dream.yml', await DreamYamlBuilder.build(userOptions))

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 2. build default config files: Done!`), { cache: true })
    log.write(c.green(`Step 3. Installing psychic dependencies...`))

    // only run yarn install if not in test env to save time
    await sspawn(`cd ${projectPath} && yarn install`)
  }

  // sleeping here because yarn has a delayed print that we need to clean up
  if (!testEnv()) await sleep(1000)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 3. Install psychic dependencies: Done!`), { cache: true })
    log.write(c.green(`Step 4. Initializing git repository...`))

    // only do this if not test, since using git in CI will fail
    await sspawn(`cd ./${appName} && git init`)
  }

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 4. Initialize git repository: Done!`), { cache: true })
    log.write(c.green(`Step 5. Building project...`))
  }

  // don't sync yet, since we need to run migrations first
  // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)

  const errors: string[] = []

  if (!testEnv() || process.env.REALLY_BUILD_CLIENT_DURING_SPECS === '1')
    if (!userOptions.apiOnly) {
      switch (userOptions.client) {
        case 'react':
          await sspawn(`cd ${rootPath} && yarn create vite client --template react-ts && cd client`)

          fs.mkdirSync(`./${appName}/client/src/config`)

          copyRecursive(__dirname + '/../boilerplate/client/api', `${projectPath}/../client/src/api`)
          copyRecursive(
            __dirname + '/../boilerplate/client/config/routes.ts',
            `${projectPath}/../client/src/config/routes.ts`,
          )
          copyRecursive(
            __dirname + '/../boilerplate/client/node-version',
            `${projectPath}/../client/.node-version`,
          )

          fs.writeFileSync(projectPath + '/../client/vite.config.ts', ViteConfBuilder.build(userOptions))
          fs.writeFileSync(projectPath + '/../client/.eslintrc.cjs', ESLintConfBuilder.buildForViteReact())

          break

        case 'vue':
          await sspawn(`cd ${rootPath} && yarn create vite client --template vue-ts`)
          fs.mkdirSync(`./${appName}/client/src/config`)

          copyRecursive(__dirname + '/../boilerplate/client/api', `${projectPath}/../client/src/api`)
          copyRecursive(
            __dirname + '/../boilerplate/client/config/routes.ts',
            `${projectPath}/../client/src/config/routes.ts`,
          )
          copyRecursive(
            __dirname + '/../boilerplate/client/node-version',
            `${projectPath}/../client/.node-version`,
          )

          fs.writeFileSync(projectPath + '/../client/vite.config.ts', ViteConfBuilder.build(userOptions))
          break

        case 'nuxt':
          await sspawn(`cd ${rootPath} && yarn create nuxt-app client`)

          fs.mkdirSync(`./${appName}/client/config`)

          copyRecursive(__dirname + '/../boilerplate/client/api', `${projectPath}/../client/src/api`)
          copyRecursive(
            __dirname + '/../boilerplate/client/config/routes.ts',
            `${projectPath}/../client/config/routes.ts`,
          )
          copyRecursive(
            __dirname + '/../boilerplate/client/node-version',
            `${projectPath}/../client/.node-version`,
          )

          break
      }

      if (!testEnv()) {
        // only bother installing packages if not in test env to save time
        await sspawn(`cd ${projectPath}/../client && yarn install --ignore-engines`)

        try {
          await sspawn(`cd ${projectPath}/../client && yarn add axios --ignore-engines`)
        } catch (err) {
          errors.push(
            `
          ATTENTION:
            we attempted to install axios for you in your client folder,
            but it failed. The error we received was:

        `,
          )
          console.error(err)
        }
      }
    }

  if (!testEnv()) {
    // do not use git during tests, since this will break in CI
    await sspawn(`cd ./${appName} && git add --all && git commit -m 'psychic init' --quiet`)

    log.restoreCache()
    log.write(c.green(`Step 5. Build project: Done!`), { cache: true })
    console.log(welcomeMessage(appName))

    errors.forEach(err => {
      console.log(err)
    })
  }
}

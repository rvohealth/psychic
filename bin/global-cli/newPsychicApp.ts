import * as fs from 'fs'
import ConfBuilder from './confBuilder'
import copyRecursive from './copyRecursive'
import EnvBuilder from './envBuilder'
import sspawn from './sspawn'
import logo from './logo'

export default async function newHowlApp(
  appName: string,
  {
    api = false,
    ws = false,
    redis = false,
    uuids = false,
  }: {
    api?: boolean
    ws?: boolean
    redis?: boolean
    uuids?: boolean
  }
) {
  let projectPath: string
  let rootPath = `./${appName}`
  const hiddenFiles = ['sequelizerc']
  if (api) {
    projectPath = `./${appName}`
    copyRecursive(__dirname + '/../../boilerplate/api', `./${appName}`)

    hiddenFiles.forEach(file => {
      fs.cpSync(`./${appName}/${file}`, `./${appName}/.${file}`)
      fs.unlinkSync(`./${appName}/${file}`)
    })
  } else {
    projectPath = `./${appName}/api`
    copyRecursive(__dirname + '/../../boilerplate', `./${appName}`)
    hiddenFiles.forEach(file => {
      fs.cpSync(`./${appName}/api/${file}`, `./${appName}/api/.${file}`)
      fs.unlinkSync(`./${appName}/api/${file}`)
    })
  }

  if (uuids) {
    fs.unlinkSync(`${projectPath}/src/app/models/user.ts`)
    fs.cpSync(`${projectPath}/src/app/models/user.uuid.ts`, `${projectPath}/src/app/models/user.ts`)
    fs.unlinkSync(`${projectPath}/src/app/models/user.uuid.ts`)

    fs.unlinkSync(`${projectPath}/src/db/migrations/1673997146315-create_users.ts`)
    fs.cpSync(
      `${projectPath}/src/db/migrations/1673997146315-create_users.uuid.ts`,
      `${projectPath}/src/db/migrations/1673997146315-create_users.ts`
    )
    fs.unlinkSync(`${projectPath}/src/db/migrations/1673997146315-create_users.uuid.ts`)
  } else {
    fs.unlinkSync(`${projectPath}/src/app/models/user.uuid.ts`)
    fs.unlinkSync(`${projectPath}/src/db/migrations/1673997146315-create_users.uuid.ts`)
  }

  fs.writeFileSync(`${projectPath}/.env`, EnvBuilder.build({ appName, env: 'development' }))
  fs.writeFileSync(`${projectPath}/.env.test`, EnvBuilder.build({ appName, env: 'test' }))

  console.log('building default configs')
  fs.writeFileSync(
    projectPath + '/src/conf/app.yml',
    ConfBuilder.buildAll({
      api,
      ws,
      redis,
      uuids,
    })
  )

  console.log('installing yarn dependencies...')
  await sspawn(`cd ${projectPath} && yarn install`)

  console.log('initializing git repository...')
  await sspawn(`cd ./${appName} && git init`)
  await sspawn(`cd ./${appName} && git add --all && git commit -m 'psychic init'`)

  console.log('building project...')
  await sspawn(`yarn --cwd=${projectPath} build`)

  if (!api) {
    console.log('building client dependencies...')
    await sspawn(`yarn --cwd=${rootPath}/client install`)
  }

  const helloMessage = `
    finished! cd into ${appName} to get started

    to create a database,
      $ psy db:create
      $ NODE_ENV=test psy db:create

    to migrate a database,
      $ psy db:migrate
      $ NODE_ENV=test psy db:migrate

    to rollback a database
      $ psy db:rollback
      $ NODE_ENV=test psy db:rollback

    to drop a database
      $ psy db:drop
      $ NODE_ENV=test psy db:drop

    to create a resource (model, migration, serializer, and controller)
      $ psy g:resource user-profile user:belongs_to likes_chalupas:boolean some_id:uuid

      # NOTE: doing it this way, you will still need to
      # plug the routes manually in your conf/routes.ts file

    to create a model
      $ psy g:model user-profile user:belongs_to likes_chalupas:boolean some_id:uuid

    to create a migration
      $ psy g:migration create-user-profiles

    to start a dev server at localhost:7777,
      $ psy dev

    to run unit tests,
      $ psy uspec

    to run feature tests,
      $ psy fspec

    to run unit tests, and then if they pass, run feature tests,
      $ psy spec

    # NOTE: before you get started, be sure to visit your .env and .env.test
    # files and make sure they have database credentials set correctly.
    # you can see conf/db.js to see how those credentials are used.
`
  console.log(logo)
  console.log(helloMessage)
}

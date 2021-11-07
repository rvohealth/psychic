import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'
import File from 'src/helpers/file'
import {
  goto,
  fillIn,
  find,
  click,
} from 'src/psyspec/story/helpers/browser'

async function resetIntegrationApp() {
  const dirsToReplace = [
    'app',
    'config',
  ]

  for (const dir of dirsToReplace) {
    await Dir.rm(`tmp/integrationtestapp/${dir}`)
    await Dir.copy(`template/psychic-app/${dir}`, `tmp/integrationtestapp/${dir}`)
  }

  await File.rm('tmp/integrationtestapp/src/App.js')
  await Dir.copy('template/psychic-app/js/App.js', 'tmp/integrationtestapp/src/App.js')

  const srcDirsToReplace = [
    'components',
  ]

  for (const dirName of srcDirsToReplace) {
    await Dir.rm(`tmp/integrationtestapp/src/${dirName}`)
    await Dir.copy(`template/psychic-app/js/${dirName}`, `tmp/integrationtestapp/src/${dirName}`)
  }
}

async function runPsyCommand(command, opts={}) {
  await spawn(
    `npm run ${command}`,
    [],
    {
      shell: true,
      stdio: 'inherit',
      cwd: 'tmp/integrationtestapp',
      env: {
        ...process.env,
        CORE_INTEGRATION_TEST: true,
      },
      ...opts,
    }
  )
}

async function runStory(path) {
  await spawn(
    `npm run psy stories ${path}`,
    [],
    {
      shell: true,
      stdio: 'inherit',
      cwd: 'tmp/integrationtestapp',
      env: {
        ...process.env,
      },
    }
  )
}

async function swapIntegrationFiles(path) {
  const files = await Dir.read(path, { onlyFiles: true })
  for (const file of files) {
    await File.rm(`tmp/integrationtestapp/${file}`)
    await File.copy(`${path}/${file}`, `tmp/integrationtestapp/${file}`)
  }

  //TODO: simplify with recursion
  const dirs = await Dir.read(path, { onlyDirs: true })
  for (const dir of dirs) {
    const files = await Dir.read(`${path}/${dir}`, { onlyFiles: true })
    for (const file of files) {
      await File.rm(`tmp/integrationtestapp/${dir}/${file}`)
      await File.copy(`${path}/${dir}/${file}`, `tmp/integrationtestapp/${dir}/${file}`)
    }

    const nestedDirs = await Dir.read(`${path}/${dir}`, { onlyDirs: true })
    for (const nestedDir of nestedDirs) {
      const files = await Dir.read(`${path}/${dir}/${nestedDir}`, { onlyFiles: true })
      for (const file of files) {
        await File.rm(`tmp/integrationtestapp/${dir}/${nestedDir}/${file}`)
        await File.copy(`${path}/${dir}/${nestedDir}/${file}`, `tmp/integrationtestapp/${dir}/${nestedDir}/${file}`)
      }
    }
  }
}

async function transpile() {
  await spawn(`npm run buildintspec`, [], { shell: true, stdio: 'inherit' })
}

global.click = click
global.fillIn = fillIn
global.find = find
global.goto = goto
global.baseUrl = 'http://localhost:33333'
global.resetIntegrationApp = resetIntegrationApp
global.runPsyCommand = runPsyCommand
global.runStory = runStory
global.swapIntegrationFiles = swapIntegrationFiles
global.transpile = transpile

import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'
import File from 'src/helpers/file'

async function goto(url) {
  await page.goto(url)
}

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

  srcDirsToReplace.forEach( async dirName => {
    await Dir.rm(`tmp/integrationtestapp/src/${dirName}`)
    await Dir.copy(`template/psychic-app/js/${dirName}`, `tmp/integrationtestapp/src/${dirName}`)
  })
}

async function runPsyCommand(command, opts={}) {
  await spawn(
    command,
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

async function swapIntegrationFiles(path) {
  const files = await Dir.read(path, { onlyFiles: true })
  for (const file of files) {
    await File.rm(`tmp/integrationtestapp/${file}`)
    await File.copy(`${path}/${file}`, `tmp/integrationtestapp/${file}`)
  }

  const dirs = await Dir.read(path, { onlyDirs: true })
  for (const dir of dirs) {
    const files = await Dir.read(`${path}/${dir}`, { onlyFiles: true })
    for (const file of files) {
      await File.rm(`tmp/integrationtestapp/${dir}/${file}`)
      await File.copy(`${path}/${dir}/${file}`, `tmp/integrationtestapp/${dir}/${file}`)
    }
  }
}

global.goto = goto
global.baseUrl = 'http://localhost:33333'
global.resetIntegrationApp = resetIntegrationApp
global.runPsyCommand = runPsyCommand
global.swapIntegrationFiles = swapIntegrationFiles

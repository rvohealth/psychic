import Dir from 'src/helpers/dir'
import File from 'src/helpers/file'

async function goto(url) {
  await page.goto(url)
}

async function resetApp() {
  await Dir.rm('tmp/integrationtestapp/app')
  await Dir.copy('template/psychic-app/app', 'tmp/integrationtestapp/app')

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

global.goto = goto
global.baseUrl = 'http://localhost:33333'
global.resetApp = resetApp

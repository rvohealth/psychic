import File from './helpers/file'

async function postNPMInstall() {
  await File.touch('.env.development')
  console.log('DONNNNEEEE', __dirname, __filename)
}

postNPMInstall()

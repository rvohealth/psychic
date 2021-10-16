import File from './helpers/file'

async function postNPMInstall() {
  await File.touch('.env.development')
}

postNPMInstall()

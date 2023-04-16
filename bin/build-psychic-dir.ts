#!/usr/bin/node

import * as fs from 'fs'

async function buildPsychicDir() {
  if (fs.existsSync(rootPath() + '/.psy')) fs.rmSync(rootPath() + '/.psy/', { force: true, recursive: true })

  fs.mkdirSync(rootPath() + '/.psy')

  // otherwise, we use the buildGlobals provided by our core spec layer
  const boilerplateSubpath = process.env.CORE_DEVELOPMENT === '1' ? 'psychic-core-dev' : 'psychic'
  console.log('BOILERPLATE PATH', boilerplateSubpath)

  fs.writeFileSync(
    rootPath() + '/.psy/buildGlobals.ts',
    fs.readFileSync(__dirname + `/boilerplate/${boilerplateSubpath}/buildGlobals.ts`)
  )
  fs.writeFileSync(rootPath() + '/.psy/init.ts', fs.readFileSync(__dirname + '/boilerplate/shared/init.ts'))

  const cacheFiles = [
    rootPath() + '/.psy/models.ts',
    rootPath() + '/.psy/controllers.ts',
    rootPath() + '/.psy/services.ts',
  ]

  cacheFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, 'export default {}')
  })
}
buildPsychicDir()

function rootPath() {
  if (process.env.CORE_DEVELOPMENT === '1') {
    return `${process.cwd()}/test-app`
  } else {
    return process.cwd() + '/src'
  }
}

#!/usr/bin/node

import * as fs from 'fs'

async function guaranteeCache() {
  if (fs.existsSync(rootPath() + '/.howl'))
    fs.rmSync(rootPath() + '/.howl/', { force: true, recursive: true })

  fs.mkdirSync(rootPath() + '/.howl')

  // otherwise, we use the buildGlobals provided by our core spec layer
  const boilerplateSubpath = process.env.CORE_DEVELOPMENT === '1' ? 'howl-core-dev' : 'howl'

  fs.writeFileSync(
    rootPath() + '/.howl/buildGlobals.ts',
    fs.readFileSync(__dirname + `/boilerplate/${boilerplateSubpath}/buildGlobals.ts`)
  )
  fs.writeFileSync(rootPath() + '/.howl/init.ts', fs.readFileSync(__dirname + '/boilerplate/shared/init.ts'))

  const cacheFiles = [
    rootPath() + '/.howl/models.ts',
    rootPath() + '/.howl/controllers.ts',
    rootPath() + '/.howl/services.ts',
  ]

  cacheFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, 'export default {}')
  })
}
guaranteeCache()

function rootPath() {
  if (process.env.CORE_DEVELOPMENT === '1') {
    return `${process.cwd()}/test-app`
  } else {
    return process.cwd() + '/src'
  }
}

import './cli/helpers/loadAppEnvFromBoot'
import fs from 'fs/promises'
import pack from '../package.json'
import path from 'path'

export default async function adaptPackageJson() {
  if (process.env.NODE_ENV === 'production') {
    pack.main = 'dist/src/index.js'
  } else {
    pack.main = 'src/index.ts'
  }

  await fs.writeFile(path.join(__dirname, '..', 'package.json'), JSON.stringify(pack, null, 2))
}
adaptPackageJson()

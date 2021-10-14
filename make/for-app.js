import fs from 'fs'
import Packager from './packager'
const packager = new Packager()

if (!fs.existsSync('app/pkg'))
  fs.mkdirSync('app/pkg')

packager.run()

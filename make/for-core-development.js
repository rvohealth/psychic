import Packager from './packager'
const packager = new Packager({
  appDir: 'src/',
  prefix: 'src/template/',
})

packager.run()

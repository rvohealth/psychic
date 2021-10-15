import Packager from './packager'
const packager = new Packager({
  appDir: 'src/',
  prefix: 'src/psychic/template/',
  originalPathPrefix: 'spec/support/testapp/',
})

packager.run()

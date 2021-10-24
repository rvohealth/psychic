import Packager from './packager'
const packager = new Packager({
  appDir: 'template/psychic-app/app/',
  prefix: '.dist/testapp/',
  // originalPathPrefix: 'spec/support/testapp/',
})

packager.run()

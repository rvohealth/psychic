import Packager from './packager'
const packager = new Packager({
  appDir: 'spec/support/testapp/app/',
  prefix: '.dist/testapp/',
  originalPathPrefix: 'spec/support/testapp/',
})

packager.run()

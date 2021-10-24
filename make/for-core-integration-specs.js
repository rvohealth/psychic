import Packager from './packager'
const packager = new Packager({
  appDir: 'tmp/integrationtestapp/',
  prefix: '.dist/testapp/',
  // originalPathPrefix: 'spec/support/testapp/',
})

packager.run()

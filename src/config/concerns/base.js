import fs from 'fs'
import path from 'path'

const BaseConfigProvider = superclass => class extends superclass {
  get appRoot() {
    if (fs.existsSync('app'))
      return 'app'
    else
      return `template/psychic-app`
  }

  get env() {
    if (ENV.CORE_TEST) return 'test'
    if (process.env.CORE_INTEGRATION_TEST) return 'development'
    return process.env.PSYCHIC_ENV || process.env.NODE_ENV || 'development'
  }

  get localStoragePath() {
    if (ENV.CORE_TEST) return 'tmp/storage/spec'
    return 'storage'
  }

  get pkgPath() {
    if (this.env === 'CORE_DEVELOPMENT') return 'src/pkg'
    return '.dist/app/pkg'
  }

  get psychicPath() {
    if (!fs.existsSync('app')) return ''
    return 'node_modules/psychic/'
  }

  get psyJsPath() {
    if (process.env.CORE_INTEGRATION_TEST) return 'src/psy'
    if (process.env.CORE_TEST) return 'tmp/spec/psy'
    return this._pathsConfig.psy_js || 'src/psy'
  }

  get root() {
    if (process.env.CORE_TEST) return 'spec/support/testapp'
    return ''
  }

  get version() {
    return '0.0.0'
  }

  pathTo(file) {
    return path.join(this.root, file)
  }
}

export default BaseConfigProvider

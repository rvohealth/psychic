const RoutesConfigProvider = superclass => class extends superclass {
  get routeCB() {
    return this._routeCB
  }

  get routesPath() {
    if (process.env.CORE_TEST && !process.env.CORE_INTEGRATION_TEST)
      return 'spec/support/testapp/config/routes'

    return 'config/routes'
  }

  get frontEndUrl() {
    return `${this.frontEndHost}:${this.frontEndPort}`
  }

  get frontEndHost() {
    return 'http://localhost'
  }

  get frontEndPort() {
    return process.env.FRONT_END_PORT || 3000
  }

  get port() {
    return process.env.PSYCHIC_PORT || 777
  }

  get wssPort() {
    return process.env.PSYCHIC_WSS_PORT || 778
  }

  get wssUrl() {
    return `ws://localhost:${this.wssPort}/`
  }
}

export default RoutesConfigProvider


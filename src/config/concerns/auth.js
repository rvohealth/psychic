const AuthConfigProvider = superclass => class extends superclass {
  get authKeys() {
    return this._authKeys
  }

  registerAuthKey(authKey, route) {
    this._authKeys[authKey] = route
  }
}

export default AuthConfigProvider

import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import DBAuthentication from 'src/dream/authentication/db'

const AuthenticationProvider = superclass => class extends superclass {
  constructor(...args) {
    super(...args)

    this._authentications = {
      db: {},
    }
  }

  async authenticate(...args) {
    if (args.length === 1) return this.authenticateAll(...args)
    return this.authenticateFor(...args)
  }

  async authenticateAll(password, opts) {
    return await this.authenticateFor(null, password, opts)
  }

  async authenticateFor(identifyingColumn, password, { strategy }={}) {
    strategy = strategy || 'db'
    switch(strategy) {
    case 'db':
      for (const key in this._authentications.db) {
        if (!!identifyingColumn && key.split('::')[0] !== identifyingColumn) continue

        const authentication = this._authentications.db[key]
        if (await bcrypt.compare(password, this[authentication.passwordColumn + '_digest']))
          return true
      }
      return false

    default:
      throw `unrecognized strategy ${strategy}`
    }
  }

  authenticates(identifyingColumn, passwordColumn, opts) {
    this._authentications.db[`${identifyingColumn}::${passwordColumn}`] =
      new DBAuthentication(identifyingColumn, passwordColumn, opts)

    this.beforeSave(async () => {
      if (this[`${passwordColumn}HasUnsavedChanges`]) {
        this[`${passwordColumn}_digest`] = await bcrypt.hash(this[passwordColumn], 11)
      }
    })

    return this
  }

  async authTokenFor(idAndPasswordStr) {
    // should throw error app secret is not set.
    const token = jwt.sign({
      key: idAndPasswordStr,
      dreamClass: this.constructor.name,
      id: this.id,
    }, process.env.PSYCHIC_SECRET || 'PLEASE_CHANGE_ME')
    return token
  }
}

export default AuthenticationProvider

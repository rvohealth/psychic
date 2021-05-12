import Authentication from 'src/dream/authentication'

export default class DBAuthentication extends Authentication {
  get identifyingColumn() {
    return this._identifyingColumn
  }

  get passwordColumn() {
    return this._passwordColumn
  }

  constructor(identifyingColumn, passwordColumn) {
    super()
    this._identifyingColumn = identifyingColumn
    this._passwordColumn = passwordColumn
  }
}

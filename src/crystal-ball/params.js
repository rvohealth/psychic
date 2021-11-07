import Psyclass from 'src/psychic/psyclass'
import ParamsFilter from 'src/crystal-ball/params/filter'

class Params extends Psyclass {
  get all() {
    return {
      ...this._body,
      ...this._query,
      ...this._uri,
    }
  }

  constructor({ body, query, uri }) {
    super({ body, query, uri })
    this._body = body
    this._query = query
    this._uri = uri

    Object
      .keys(this.all)
      .forEach(field => {
        Object.defineProperty(this, field, {
          get: () => this.all[field],
          configurable: true,
        })
      })
  }

  require(field) {
    return ParamsFilter.new(this.all).require(field)
  }

  permit(...fields) {
    return ParamsFilter.new(this.all).filter(...fields)
  }
}

export default Params

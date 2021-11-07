import Psyclass from 'src/psychic/psyclass'

class ParamsFilter extends Psyclass {
  constructor(params, { roots }={}) {
    super(params)
    this._params = params
    this._roots = roots || []
  }

  require(field) {
    if (!field) throw `Missing required argument field`
    if (!this._params[field]) throw `Missing required param ${this._roots.join('.')}.${field}`

    return ParamsFilter.new(this._params[field], [
      ...this._roots,
      field,
    ])
  }

  permit(...fields) {
    if (!fields) throw `Missing required argument field`

    const filteredParams = {}
    Object
      .keys(this._params)
      .filter(field => {
        return fields.includes(field)
      })
      .forEach(field => {
        filteredParams[field] = this._params[field]
      })

    return filteredParams
  }
}

export default ParamsFilter

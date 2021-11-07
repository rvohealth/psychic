import pluralize from 'pluralize'
import paramCase from 'src/helpers/paramCase'
import config from 'src/config'
import Projection from 'src/projection'
import Unauthorized from 'src/error/crystal-ball/unauthorized'
import esp from 'src/esp'

export default class Channel {
  static get paramName() {
    return paramCase(this.name)
  }

  static get assumedDreamClass() {
    const dreamName = paramCase(pluralize.singular(this.name.replace(/Channel$/, '')))
    return config.dream(dreamName)
  }

  get authentications() {
    return this._authentications
  }

  get projection() {
    if (this.constructor.projection) return this.constructor.projection
    if (this.constructor.assumedDreamClass)
      return config.projection(this.constructor.assumedDreamClass.name)
    return null
  }

  get paramName() {
    return this.constructor.paramName
  }

  get params() {
    return this.vision.params
  }

  get request() {
    return this.vision.request
  }

  get response() {
    return this.vision.response
  }

  get vision() {
    return this._vision
  }

  constructor(vision) {
    this._vision = vision
    this._authentications = {}

    // errors!
    if (this.initialize) this.initialize()
  }

  authenticates(dreamName, opts) {
    const snakeifiedDream = dreamName.camelize().snakeify()
    const DreamClass = config.dream(snakeifiedDream)
    if (!DreamClass) throw `Failed to look up dream class for ${dreamName} (lookup at ${snakeifiedDream})`
    const authKey = opts.as || `current${DreamClass.name}`

    this._authentications[authKey] = { ...opts, DreamClass }
    Object.defineProperty(this, authKey, {
      get: () => this.vision.auth[authKey],
      configurable: true,
    })

    this.auth = async () => {
      if (!opts.against) throw `eventually do automatic lookup of first authentication and grab identifyingColumn`
      if (!opts.against.split(':').length > 1) throw 'against must be passed as "id_column:password_column"'
      const [ identifyingColumn, passwordColumn ] = opts.against.split(':')

      const dream = await DreamClass
        .where({ [identifyingColumn]: this.params[identifyingColumn] })
        .first()

      if (!dream)
        throw new Unauthorized()

      if (!(await dream.authenticate(identifyingColumn, this.params[passwordColumn])))
        throw new Unauthorized()

      const token = await dream.authTokenFor(opts.against)
      this.response.cookie(
        authKey,
        token,
        {
          maxAge: config.cookies.maxAge,
          httpOnly: true,
        },
      )

      esp.transmit('psy:authed', { token, key: authKey })

      return this.json({ token })
    }

    this.signout = async () => {
      this.response.cookie(
        authKey,
        '', // set to a blank string, then set max age to 0 to remove immediately
        {
          maxAge: 0,
          httpOnly: true,
        },
      )
      this.json({ signedOut: true })
    }
  }

  emit(to, path, data) {
    this.vision.emit(to, path, data)
  }

  json(obj, opts) {
    return this.vision.json(obj, opts)
  }

  project(obj, projection=this.projection) {
    if (projection) return new projection(obj).cast()
    return new Projection(obj).cast()
  }

  paramsFor(dreamClass) {
    if (!dreamClass) throw 'Missing required argument "dreamClass"'

    // TODO: use config to drive timestamp and id fields
    const ignoreFields = ['id', 'createdAt', 'updatedAt']

    const params = {}
    Object.keys(config.schema[dreamClass.table]).forEach(attribute => {
      if (this.params[attribute] && !ignoreFields.includes(attribute))
        params[attribute] = this.params[attribute]
    })
    return params
  }
}

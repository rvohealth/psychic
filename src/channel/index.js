import pluralize from 'pluralize'
import paramCase from 'src/helpers/paramCase'
import snakeCase from 'src/helpers/snakeCase'
import camelCase from 'src/helpers/camelCase'
import config from 'src/config'
import Projection from 'src/projection'

import NotFound from 'src/error/crystal-ball/not-found'
import Unauthorized from 'src/error/crystal-ball/unauthorized'

export default class Channel {
  static get paramName() {
    return paramCase(this.name)
  }

  static get assumedDreamClass() {
    const dreamName = paramCase(pluralize.singular(this.name.replace(/Channel$/, '')))
    return config.dream(dreamName)
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
    return this.request.params
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

    // errors!
    if (this.initialize) this.initialize()
  }

  authenticates(dreamName, { against }={}) {
    const DreamClass = config.dream(snakeCase(camelCase(dreamName)))

    this.signIn = async () => {
      if (!against) throw `eventually do automatic lookup of first authentication and grab identifyingColumn`
      const dream = await DreamClass
        .where({ [against]: this.request.params[against] })
        .first()

      if (!dream) throw new NotFound()
      if (!(await dream.authenticate(against, this.params.password))) throw new Unauthorized()
      return this.json({ token: await dream.authTokenFor(against) })
    }
  }

  json(obj, { projection }={}) {
    if (obj.isDream)
      return this.response.json(this.project(obj, projection))

    if (Array.isArray(obj) && obj[0].isDream)
      return this.response.json(
        obj.map(dream => this.project(dream, projection))
      )

    return this.response.json(obj)
  }

  project(obj, projection=this.projection) {
    if (this.projection) return new projection(obj).cast()
    return new Projection(obj).cast()
  }
}

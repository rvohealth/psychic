import include from 'src/helpers/include'

class Psyclass {
  static new(...args) {
    return new this(...args)
  }

  static alias(methodName, { to, target, strict, getter, setter }={}) {
    if (!methodName) throw 'Missing required argument "methodName"'
    if (!to) throw 'Missing required argument "to"'

    if (strict === undefined) strict = true
    if (methodName === to && strict) throw `cannot alias ${methodName} to itself`
    if (methodName === to) return

    let thistarget
    switch (target) {
    case 'static':
      thistarget = this
      break

    default:
      thistarget = this.prototype
    }

    if (getter)
      Object.defineProperty(thistarget, methodName, {
        get: function() {
          return this[to]
        },
        configurable: true,
      })

    else if (setter)
      Object.defineProperty(thistarget, methodName, {
        set: function(val) {
          this[to] = val
        },
        configurable: true,
      })

    else
      thistarget[methodName] = function(...args) {
        return this[to].constructor.name === 'Function' ?
          this[to](...args) :
          this[to]
      }

    return this
  }

  static delegate(methodName, { to, target, getter }) {
    if (!methodName) throw 'Missing required argument "methodName"'
    if (!to) throw 'Missing required argument "to"'

    let thistarget
    switch (target) {
    case 'static':
      thistarget = this
      break

    default:
      thistarget = this.prototype
    }

    if (getter)
      Object.defineProperty(thistarget, methodName, {
        get: function() {
          return new Promise(resolve => {
            if (this[to].constructor.name !== 'Function') return resolve(this[to])

            const result = this[to]()
            if (result.then) {
              result.then(actualResult => {
                resolve(actualResult[methodName])
              })
            } else resolve(result[methodName])
          })
        },
        configurable: true,
      })

    else
      thistarget[methodName] = async function (...args) {
        const toResult = this[to].constructor.name === 'Function' ?
          await this[to]() :
          this[to]

        return toResult[methodName].constructor.name === 'Function' ?
          toResult[methodName](...args) :
          toResult[methodName]
      }
    return this
  }

  static include(...mixins) {
    include(this, ...mixins)
    return this
  }

  alias(methodName, opts) {
    return this.contructor.alias(methodName, opts)
  }

  delegate(methodName, opts) {
    return this.contructor.delegate(methodName, opts)
  }

  include(...mixins) {
    include(this, ...mixins)
    return this
  }
}

export default Psyclass

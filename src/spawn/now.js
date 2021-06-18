import path from 'path'
import SpawnEvent from 'src/spawn/event'

export default class Now extends SpawnEvent {
  add(...args) {
    let classOrInstance,
      methodName,
      _args

    switch(args.length) {
    case 3:
      classOrInstance = args[0]
      methodName = args[1]
      _args = args[2]

      if (typeof classOrInstance[methodName] === 'function')
        this.addClassMethod(classOrInstance, methodName, _args)

      else if(typeof classOrInstance.prototype[methodName] === 'function')
        this.addInstanceMethod(classOrInstance, methodName, _args)

      break

    case 1:
      this.addFunction(args[0], args[1])
      break

    default:
      throw `unrecognized number of arguments for Now#add. should be 2 or 3 arguments, where last arg passed is an array`
    }
  }

  addFunction() {
  }

  addClassMethod(klass, methodName, args) {
    const jobName = this._generateName(`${klass}.${methodName}.${JSON.stringify(args)}`, '0')
    klass[methodName].apply(klass, args)
    this._bree.add({
      name: jobName,
      path: path.join(__dirname.replace(/\/src\//, '/dist/'), 'jobs', 'basic.js'),
      timeout: 0,
      worker: {
        argv: [klass.name, methodName, ...args],
        // argv: [cb.toString(), ...args],
      },
    })
    this._bree.start()
  }

  addInstanceMethod() {
  }
}

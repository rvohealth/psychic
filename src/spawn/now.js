import SpawnEvent from 'src/spawn/event'

export default class Now extends SpawnEvent {
  add(...args) {
    let classOrInstance,
      methodName,
      _args,
      opts

    switch(args.length) {
    case 4:
      classOrInstance = args[0]
      methodName = args[1]
      _args = args[2]
      opts = args[3]

      if (opts.instance || opts.dream)
        this.addInstanceMethod(classOrInstance, methodName, _args, opts.constructorArgs)
      else
        this.addStaticMethod(classOrInstance?.name || classOrInstance, methodName, _args)

      break

    case 3:
      classOrInstance = args[0]
      methodName = args[1]
      _args = args[2]

      if (classOrInstance.isDreamInstance)
        this.addInstanceMethod(classOrInstance, methodName, _args)
      else
        this.addStaticMethod(classOrInstance?.name || classOrInstance, methodName, _args)
      break

    case 2:
      this.addFunction(args[0], args[1])
      break

    default:
      throw `unrecognized number of arguments for Now#add. should be 2 or 3 arguments, where last arg passed is an array`
    }
  }

  addFunction(cb, args) {
    const jobName = this._generateName(`${cb.toString()}.${JSON.stringify(args)}`, '0')
    const payload = JSON.stringify({
      jobName,
      cbString: cb.toString(),
      args,
      approach: 'annonymous',
    })
    this._bree.add({
      name: jobName,
      path: this._jobPath('call-in-background'),
      timeout: 0,
      worker: {
        argv: [ payload ],
      },
    })
    this._bree.start()
  }

  addStaticMethod(className, methodName, args) {
    const jobName = this._generateName(`${className}.${methodName}.${JSON.stringify(args)}`, '0')
    const payload = JSON.stringify({
      jobName,
      className,
      methodName,
      args,
      approach: 'static',
    })
    this._bree.add({
      name: jobName,
      path: this._jobPath('call-in-background'),
      timeout: 0,
      worker: {
        argv: [ payload ],
      },
    })
    this._bree.start()
  }

  addInstanceMethod(classNameOrInstance, methodName, args, constructorArgs=[]) {
    let className = classNameOrInstance
    let dreamId = null
    let isDream = false
    if (classNameOrInstance.isDream && classNameOrInstance.id !== undefined && classNameOrInstance.id !== null) {
      className = classNameOrInstance.constructor.name
      dreamId = classNameOrInstance.id
      isDream = true
    }

    const jobName = this._generateName(`${className}.${methodName}.${JSON.stringify(args)}`, '0')
    const payload = JSON.stringify({
      jobName,
      className,
      methodName,
      args,
      isDream,
      dreamId,
      constructorArgs,
      approach: 'instance',
    })
    this._bree.add({
      name: jobName,
      path: this._jobPath('call-in-background'),
      timeout: 0,
      worker: {
        argv: [ payload ],
      },
    })
    this._bree.start()
  }
}

import path from 'path'
import Bree from 'bree'
import Now from 'src/spawn/now'

// see https://github.com/breejs/bree for scheduling api, since this is a light-weight
// wrapper around it.

export default class Spawn {
  constructor() {
    this._bree = new Bree({
      root: false,
      errorHandler: error => {
        console.log(error)
      },
    })
  }

  in(timeout, cb, data=null) {
    const name = this._name(cb, timeout)
    this._bree.add({
      name,
      timeout,
      path: cb, // this is how you pass cb to bree currently (though they dont recommend it).
      // path: 'spawn',
      worker: {
        workerData: data,
      },
    })
    this._bree.start()
  }

  now(...args) {
    return new Now({
      bree: this._bree,
    }).add(...args)
    // const name = this._name(cb, '0')
    // this._bree.add({
    //   name,
    //   path: path.join(__dirname, 'jobs', 'basic.js'),
    //   timeout: 0,
    //   worker: {
    //     argv: [cb.toString(), ...args],
    //   },
    // })
    // this._bree.start()
  }

  on(date, cb, data=null) {
    const name = this._name(cb, date.toString())
    this._bree.add({
      name,
      date,
      path: cb, // this is how you pass cb to bree currently (though they dont recommend it).
      worker: {
        workerData: data,
      },
    })
    this._bree.start()
  }

  cron(cronStr, cb, data=null) {
    const name = this._name(cb, cronStr)
    this._bree.add({
      name,
      cron: cronStr,
      path: cb, // this is how you pass cb to bree currently (though they dont recommend it).
      cronValidate: {
        useBlankDay: true,
      },
      worker: {
        workerData: data,
      },
    })
    this._bree.start()
  }

  every(interval, cb, data=null) {
    const name = this._name(cb, interval)
    this._bree.add({
      name,
      interval,
      path: path.resolve('src/spawn/jobs/spawn.js'),
      // path: cb, // this is how you pass cb to bree currently (though they dont recommend it).
      worker: {
        workerData: data,
      },
    })
    this._bree.start()
  }

  _name(cb, identifier) {
    return md5(cb.toString() + '::' + identifier)
  }
}

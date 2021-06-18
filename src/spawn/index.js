import path from 'path'
import Bree from 'bree'

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

  now(cb, ...args) {
    const name = this._name(cb, '0')
    this._bree.add({
      name,
      path: () => {
        const cbStr = process.argv[2]
        const args = process.argv.slice(3)
        const cb = new Function('return ' + cbStr)()
        cb.apply(null, args)
      }, // this is how you pass cb to bree currently (though they dont recommend it).
      timeout: 0,
      worker: {
        argv: [cb.toString(), ...args],
      },
    })
    this._bree.start()
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

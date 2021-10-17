import Queue from 'bull'
import Psyclass from 'src/psychic/psyclass'
import config from 'src/config'

class PhantomManager extends Psyclass {
  constructor() {
    super()
    this.queues = {}
  }

  static get redisConfig() {
    return {
      host: config.redisHost,
      db: config.redisDB,
      port: config.redisPort,
      // password: config.redisPassword,
    }
  }

  static get internalQueueConf() {
    return {
      config: this.redisConfig,
    }
  }

  setConfig(phantomConfig) {
    this._buildInternalQueues()

    if (!phantomConfig || typeof phantomConfig !== 'object') return

    Object.keys(phantomConfig).forEach(queueName => {
      this.queues[queueName].config = phantomConfig[queueName]
      this.queues[queueName].queue = new Queue(queueName, this.queues[queueName])
    })
  }

  queue(queueName, internal=false) {
    if (internal) queueName = `__psy_${queueName}`
    return this.queues[queueName].queue
  }

  addInstanceDreamMethod(dreamName, id, methodName, ...args) {
    const queue = this.queue('dream.instance', true)
    queue.add({
      dreamName,
      methodName,
      id,
      args,
    })
  }

  addStaticDreamMethod(dreamName, methodName, ...args) {
    const queue = this.queue('dream.static', true)
    queue.add({
      dreamName,
      methodName,
      args,
    })
  }

  _buildInternalQueues() {
    this._buildDefaultQueue()
    this._buildDreamStaticQueue()
    this._buildDreamInstanceQueue()
  }

  _buildDreamStaticQueue() {
    const queueConf = this.constructor.internalQueueConf
    this.queues['__psy_dream.static'] = queueConf
    this.queues['__psy_dream.static'].queue = new Queue('__psy.dream.static', queueConf.config)

    this.queues['__psy_dream.static'].queue.process(async (job, done) => {
      const { dreamName, methodName, args } = job.data
      const dreamKlass = config.dream(dreamName)

      if (!dreamKlass) throw `Dream not found: ${dreamName}`
      if (!dreamKlass[methodName]) throw `${dreamKlass.name}.${methodName} is not a function`

      if (dreamKlass[methodName].constructor.name === 'AsyncFunction')
        await dreamKlass[methodName](...args)
      else
        dreamKlass[methodName](...args)

      done()
    })
  }

  _buildDreamInstanceQueue() {
    const queueConf = this.constructor.internalQueueConf
    this.queues['__psy_dream.instance'] = queueConf
    this.queues['__psy_dream.instance'].queue = new Queue('__psy.dream.instance', queueConf.config)

    this.queues['__psy_dream.instance'].queue.process(async (job, done) => {
      const { dreamName, id, methodName, args } = job.data
      const dreamKlass = config.dream(dreamName)

      if (!dreamKlass) throw `Dream not found: ${dreamName}`
      if (!dreamKlass.prototype[methodName]) throw `${dreamKlass.name}#${methodName} is not a function`

      const record = await dreamKlass.find(id)
      if (!record) throw `${dreamKlass} with id: ${id} was not found`

      if (dreamKlass.prototype[methodName].constructor.name === 'AsyncFunction')
        await record[methodName](...args)
      else
        record[methodName](...args)

      done()
    })
  }

  _buildDefaultQueue() {
    this.queues['__psy_default'] = {
      config: {
        redis: PhantomManager.redisConfig,
      }
    }
    this.queues['__psy_default'].queue =
      new Queue('__psy.default', this.queues['__psy_default'].config)
  }
}

const phantomManager = new PhantomManager()

export default phantomManager

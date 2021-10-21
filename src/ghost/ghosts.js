import Queue from 'bull'
import Psyclass from 'src/psychic/psyclass'
import config from 'src/config'

class Ghosts extends Psyclass {
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

  setConfig(ghostConfig) {
    this.#buildInternalQueues()

    if (!ghostConfig || typeof ghostConfig !== 'object') return

    Object.keys(ghostConfig).forEach(queueName => {
      this.queues[queueName].config = ghostConfig[queueName]
      this.queues[queueName].queue = new Queue(queueName, this.queues[queueName])
    })
  }

  queue(queueName, internal=false) {
    if (internal) queueName = `__psy_${queueName}`
    return this.queues[queueName]?.queue
  }

  addDreamInstanceMethod(dreamName, id, methodName, ...args) {
    const queue = this.queue('dream.instance', true)
    queue.add({
      dreamName,
      methodName,
      id,
      args,
    })
  }

  addDreamStaticMethod(dreamName, methodName, ...args) {
    const queue = this.queue('dream.static', true)
    queue.add({
      dreamName,
      methodName,
      args,
    })
  }

  addStaticMethod(klass, methodName, ...args) {
    const queue = this.queue('static', true)
    queue.add({
      klass,
      methodName,
      args,
    })
  }

  #buildInternalQueues() {
    this.#buildDefaultQueue()
    this.#buildStaticQueue()
    this.#buildDreamStaticQueue()
    this.#buildDreamInstanceQueue()
  }

  #buildStaticQueue() {
    const queueConf = this.constructor.internalQueueConf
    this.queues['__psy_static'] = queueConf
    this.queues['__psy_static'].queue = new Queue('__psy.static', queueConf.config)
    this.queues['__psy_static'].queue.process(this._processDreamStaticMethod)
  }

  #buildDreamStaticQueue() {
    const queueConf = this.constructor.internalQueueConf
    this.queues['__psy_dream.static'] = queueConf
    this.queues['__psy_dream.static'].queue = new Queue('__psy.dream.static', queueConf.config)
    this.queues['__psy_dream.static'].queue.process(this._processDreamStaticMethod)
  }

  #buildDreamInstanceQueue() {
    const queueConf = this.constructor.internalQueueConf
    this.queues['__psy_dream.instance'] = queueConf
    this.queues['__psy_dream.instance'].queue = new Queue('__psy.dream.instance', queueConf.config)
    this.queues['__psy_dream.instance'].queue.process(this._processDreamInstanceMethod)
  }

  #buildDefaultQueue() {
    this.queues['__psy_default'] = {
      config: {
        redis: Ghosts.redisConfig,
      }
    }
    this.queues['__psy_default'].queue =
      new Queue('__psy.default', this.queues['__psy_default'].config)
  }

  async _processStaticMethod(job, done) {
    const { klass, methodName, args } = job.data
    if (!klass[methodName]) throw `${klass.name}.${methodName} is not a function`

    if (klass[methodName].constructor.name === 'AsyncFunction')
      await klass[methodName](...args)
    else
      klass[methodName](...args)

    done()
  }

  async _processDreamStaticMethod(job, done) {
    const { dreamName, methodName, args } = job.data
    const dreamKlass = config.dream(dreamName)

    if (!dreamKlass) throw `Dream not found: ${dreamName}`
    if (!dreamKlass[methodName]) throw `${dreamKlass.name}.${methodName} is not a function`

    if (dreamKlass[methodName].constructor.name === 'AsyncFunction')
      await dreamKlass[methodName](...args)
    else
      dreamKlass[methodName](...args)

    done()
  }

  async _processDreamInstanceMethod(job, done) {
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
  }
}

const ghosts = global.__psychic__ghosts || new Ghosts()
global.__psychic__ghosts = ghosts

export default ghosts

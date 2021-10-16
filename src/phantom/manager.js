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
      password: config.redisPassword,
    }
  }

  setConfig(phantomConfig) {
    this.queues['__psy_default'] = {
      config: {
        redis: PhantomManager.redisConfig,
      }
    }
    this.queues['__psy_default'].queue =
      new Queue('__psy.default', this.queues['__psy_default'].config)

    this.queues['__psy_dream.static'] = {
      config: {
        redis: PhantomManager.redisConfig,
      }
    }
    this.queues['__psy_dream.static'].queue =
      new Queue('__psy.dream.static', this.queues['__psy_dream.static'].config)
    this.queues['__psy_dream.static'].process = function(job, done) {
      console.log('STATIC QUEEEUEUEUEUEUEUEUE')
      const { dreamKlass, method, args } = job.data
      console.log(config.dream(dreamKlass), method, args)
      done()
    }

    this.queues['__psy_dream.instance'] = {
      config: {
        redis: PhantomManager.redisConfig,
      }
    }
    this.queues['__psy_dream.instance'].queue =
      new Queue('__psy.dream.instance', this.queues['__psy_dream.instance'].config)

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

  addStaticDreamMethod(dreamKlass, methodName, ...args) {
    this.queue('dream.static', true).add({
      dreamKlass,
      methodName,
      args,
    })
  }
}

const phantomManager = new PhantomManager()

export default phantomManager

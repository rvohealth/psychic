import { Dream, IdType, pascalize, testEnv } from '@rvohealth/dream'
import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import Redis, { Cluster } from 'ioredis'
import { devEnvBool } from '../helpers/envValue'
import PsychicApplication, {
  BullMQNativeWorkerOptions,
  PsychicBackgroundNativeBullMQOptions,
  PsychicBackgroundSimpleOptions,
  PsychicBackgroundWorkstreamOptions,
  QueueOptionsWithConnectionInstance,
} from '../psychic-application'
import lookupClassByGlobalName from '../psychic-application/helpers/lookupClassByGlobalName'

type JobTypes =
  | 'BackgroundJobQueueFunctionJob'
  | 'BackgroundJobQueueStaticJob'
  | 'BackgroundJobQueueInstanceJob'
  | 'BackgroundJobQueueModelInstanceJob'

export interface BackgroundJobData {
  id?: IdType
  method?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructorArgs?: any
  filepath?: string
  importKey?: string
  globalName?: string
  priority: BackgroundQueuePriority
}

export class Background {
  public static get defaultQueueName() {
    const psychicApp = PsychicApplication.getOrFail()
    return `${pascalize(psychicApp.appName)}BackgroundJobQueue`
  }

  public static get Worker(): typeof Worker {
    const psychicApp = PsychicApplication.getOrFail()
    return (psychicApp.backgroundOptions.providers?.Worker || Worker) as typeof Worker
  }

  public static get Queue(): typeof Queue {
    const psychicApp = PsychicApplication.getOrFail()
    return (psychicApp.backgroundOptions.providers?.Queue || Queue) as typeof Queue
  }

  public static get QueueEvents(): typeof QueueEvents {
    const psychicApp = PsychicApplication.getOrFail()
    return (psychicApp.backgroundOptions.providers?.QueueEvents || QueueEvents) as typeof QueueEvents
  }

  public queues: Queue[] = []
  public queueEvents: QueueEvents[] = []
  public workers: Worker[] = []

  public connect(
    opts: {
      activateWorkers: boolean
    } = { activateWorkers: false },
  ) {
    const activateWorkers = opts.activateWorkers

    if (testEnv() && !devEnvBool('REALLY_TEST_BACKGROUND_QUEUE')) return
    if (this.queues.length) return

    const psychicApp = PsychicApplication.getOrFail()

    if (!psychicApp?.useRedis)
      throw new Error(`attempting to use background jobs, but config.useRedis is not set to true.`)

    const defaultBullMQQueueOptions = psychicApp.backgroundOptions.defaultBullMQQueueOptions || {}

    if ((psychicApp.backgroundOptions as PsychicBackgroundNativeBullMQOptions).nativeBullMQ) {
      ///////////////////////////
      // native BullMQ options //
      ///////////////////////////

      const backgroundOptions: PsychicBackgroundNativeBullMQOptions =
        psychicApp.backgroundOptions as PsychicBackgroundNativeBullMQOptions
      const nativeBullMQ = backgroundOptions.nativeBullMQ
      const defaultConnection = nativeBullMQ.defaultQueueOptions?.connection || backgroundOptions.connection
      const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultConnection)

      //////////////////////////
      // create default queue //
      //////////////////////////
      this.queues.push(
        new Background.Queue(formattedQueueName, {
          ...defaultBullMQQueueOptions,
          ...(nativeBullMQ.defaultQueueOptions || {}),
          connection: defaultConnection,
        }),
      )
      this.queueEvents.push(new Background.QueueEvents(formattedQueueName, { connection: defaultConnection }))
      ///////////////////////////////
      // end: create default queue //
      ///////////////////////////////

      /////////////////////////////
      // create default workers //
      /////////////////////////////
      if (activateWorkers) {
        for (let i = 0; i < (nativeBullMQ.defaultWorkerCount || 1); i++) {
          this.workers.push(
            new Background.Worker(formattedQueueName, data => this.handler(data), {
              ...(backgroundOptions.nativeBullMQ.defaultWorkerOptions || {}),
              connection: defaultConnection,
            }),
          )
        }
      }
      /////////////////////////////////
      // end: create default workers //
      /////////////////////////////////

      /////////////////////////
      // create named queues //
      /////////////////////////
      const namedQueueOptionsMap: Record<string, QueueOptionsWithConnectionInstance> =
        nativeBullMQ.namedQueueOptions || {}

      Object.keys(namedQueueOptionsMap).forEach(queueName => {
        const namedQueueOptions: QueueOptionsWithConnectionInstance = namedQueueOptionsMap[queueName]
        const namedQueueConnection = namedQueueOptions.connection || defaultConnection
        const formattedQueuename = nameToRedisQueueName(queueName, namedQueueConnection)

        this.queues.push(
          new Background.Queue(formattedQueuename, {
            ...defaultBullMQQueueOptions,
            ...namedQueueOptions,
            connection: namedQueueConnection,
          }),
        )
        this.queueEvents.push(
          new Background.QueueEvents(formattedQueuename, { connection: namedQueueConnection }),
        )

        //////////////////////////
        // create extra workers //
        //////////////////////////
        if (activateWorkers) {
          ;(nativeBullMQ.extraWorkers || [])
            .filter(extraWorkerOptions => extraWorkerOptions.queueName === queueName)
            .forEach((extraWorkerOptions: BullMQNativeWorkerOptions) => {
              for (let i = 0; i < (extraWorkerOptions.workerCount || 1); i++) {
                this.workers.push(
                  new Background.Worker(formattedQueuename, data => this.handler(data), {
                    ...extraWorkerOptions,
                    connection: namedQueueConnection,
                  }),
                )
              }
            })
        }
        ///////////////////////////////
        // end: create extra workers //
        ///////////////////////////////
      })
      //////////////////////////////
      // end: create named queues //
      //////////////////////////////

      ////////////////////////////////
      // end: native BullMQ options //
      ////////////////////////////////
    } else {
      /////////////////////////////////
      // Psychic background options //
      /////////////////////////////////
      const backgroundOptions: PsychicBackgroundSimpleOptions =
        psychicApp.backgroundOptions as PsychicBackgroundSimpleOptions
      const defaultConnection = backgroundOptions.connection
      const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultConnection)

      ///////////////////////////////
      // create default workstream //
      ///////////////////////////////
      this.queues.push(
        new Background.Queue(formattedQueueName, {
          ...defaultBullMQQueueOptions,
          connection: defaultConnection,
        }),
      )
      this.queueEvents.push(new Background.QueueEvents(formattedQueueName, { connection: defaultConnection }))
      ////////////////////////////////////
      // end: create default workstream //
      ////////////////////////////////////

      /////////////////////////////
      // create default workers //
      /////////////////////////////
      if (activateWorkers) {
        for (let i = 0; i < (backgroundOptions.defaultWorkstream?.parallelization || 1); i++) {
          this.workers.push(
            new Background.Worker(formattedQueueName, data => this.handler(data), {
              connection: defaultConnection,
            }),
          )
        }
      }
      /////////////////////////////////
      // end: create default workers //
      /////////////////////////////////

      //////////////////////////////
      // create named workstreams //
      //////////////////////////////
      const namedWorkstreams: PsychicBackgroundWorkstreamOptions[] = backgroundOptions.namedWorkstreams || []

      namedWorkstreams.forEach(namedWorkstream => {
        const namedWorkstreamConnection = namedWorkstream.connection || defaultConnection
        const namedWorkstreamFormattedQueueName = nameToRedisQueueName(
          namedWorkstream.name,
          namedWorkstreamConnection,
        )

        this.queues.push(
          new Background.Queue(namedWorkstreamFormattedQueueName, {
            ...defaultBullMQQueueOptions,
            connection: namedWorkstreamConnection,
          }),
        )
        this.queueEvents.push(
          new Background.QueueEvents(namedWorkstreamFormattedQueueName, {
            connection: namedWorkstreamConnection,
          }),
        )

        //////////////////////////
        // create named workers //
        //////////////////////////
        if (activateWorkers) {
          for (let i = 0; i < (namedWorkstream.parallelization || 1); i++) {
            this.workers.push(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              new Background.Worker(namedWorkstreamFormattedQueueName, data => this.handler(data), {
                group: {
                  limit: namedWorkstream.rateLimit,
                },
                connection: namedWorkstreamConnection,
                // typing as any because Psychic can't be aware of BullMQ Pro options
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any),
            )
          }
        }
        ///////////////////////////////
        // end: create named workers //
        ///////////////////////////////
      })
      ///////////////////////////////////
      // end: create named workstreams //
      ///////////////////////////////////

      ////////////////////////////////
      // Psychic background options //
      ////////////////////////////////
    }
  }

  public work() {
    this.connect({ activateWorkers: true })
  }

  public async staticMethod(
    ObjectClass: Record<'name', string>,
    method: string,
    {
      delaySeconds,
      globalName,
      args = [],
      priority = 'default',
    }: {
      globalName: string
      filepath?: string
      delaySeconds?: number
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      priority?: BackgroundQueuePriority
    },
  ) {
    this.connect()
    await this._addToQueue(
      `BackgroundJobQueueStaticJob`,
      {
        globalName,
        method,
        args,
        priority,
      },
      { delaySeconds },
    )
  }

  public async scheduledMethod(
    ObjectClass: Record<'name', string>,
    pattern: string,
    method: string,
    {
      globalName,
      args = [],
      priority = 'default',
    }: {
      globalName: string
      filepath?: string
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      priority?: BackgroundQueuePriority
    },
  ) {
    this.connect()

    // `jobId` is used to determine uniqueness along with name and repeat pattern.
    // Since the name is really a job type and never changes, the `jobId` is the only
    // way to allow multiple jobs with the same cron repeat pattern. Uniqueness will
    // now be enforced by combining class name, method name, and cron repeat pattern.
    //
    // See: https://docs.bullmq.io/guide/jobs/repeatable
    const jobId = `${ObjectClass.name}:${method}`

    await this.queue!.add(
      'BackgroundJobQueueStaticJob',
      {
        globalName,
        method,
        args,
        priority,
      },
      {
        repeat: {
          pattern,
        },
        jobId,
        priority: this.getPriorityForQueue(priority),
      },
    )
  }

  public async instanceMethod(
    ObjectClass: Record<'name', string>,
    method: string,
    {
      delaySeconds,
      globalName,
      args = [],
      constructorArgs = [],
      priority = 'default',
    }: {
      globalName: string
      delaySeconds?: number
      filepath?: string
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructorArgs?: any[]
      priority?: BackgroundQueuePriority
    },
  ) {
    this.connect()
    await this._addToQueue(
      'BackgroundJobQueueInstanceJob',
      {
        globalName,
        method,
        args,
        constructorArgs,
        priority,
      },
      { delaySeconds },
    )
  }

  public async modelInstanceMethod(
    modelInstance: Dream,
    method: string,
    {
      delaySeconds,
      args = [],
      priority = 'default',
    }: {
      delaySeconds?: number
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      priority?: BackgroundQueuePriority
    },
  ) {
    this.connect()
    await this._addToQueue(
      'BackgroundJobQueueModelInstanceJob',
      {
        id: modelInstance.primaryKeyValue,
        globalName: (modelInstance.constructor as typeof Dream).globalName,
        method,
        args,
        priority,
      },
      { delaySeconds },
    )
  }

  // should be private, but public so we can test
  public async _addToQueue(
    jobType: JobTypes,
    jobData: BackgroundJobData,
    {
      delaySeconds,
    }: {
      delaySeconds?: number
    },
  ) {
    if (testEnv() && !devEnvBool('REALLY_TEST_BACKGROUND_QUEUE')) {
      await this.doWork(jobType, jobData)
    } else {
      await this.queue!.add(jobType, jobData, {
        delay: delaySeconds ? delaySeconds * 1000 : undefined,
        priority: this.getPriorityForQueue(jobData.priority),
      })
    }
  }

  private getPriorityForQueue(priority: BackgroundQueuePriority) {
    switch (priority) {
      case 'urgent':
        return 1
      case 'default':
        return 2
      case 'not_urgent':
        return 3
      case 'last':
        return 4
      default:
        return 2
    }
  }

  public async doWork(
    jobType: JobTypes,
    { id, method, args, constructorArgs, globalName }: BackgroundJobData,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let objectClass: any
    let dreamClass: typeof Dream | undefined

    switch (jobType) {
      case 'BackgroundJobQueueStaticJob':
        if (globalName) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          objectClass = lookupClassByGlobalName(globalName)
        }

        if (!objectClass) return

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await objectClass[method!](...args)
        break

      case 'BackgroundJobQueueInstanceJob':
        if (globalName) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          objectClass = lookupClassByGlobalName(globalName)
        }

        if (objectClass) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          const instance = new objectClass(...constructorArgs)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await instance[method!](...args)
        }

        break

      case 'BackgroundJobQueueModelInstanceJob':
        if (globalName) {
          dreamClass = lookupClassByGlobalName(globalName) as typeof Dream | undefined
        }

        if (dreamClass) {
          const modelInstance = await dreamClass.find(id)
          if (!modelInstance) return

          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await (modelInstance as any)[method!](...args)
        }
        break
    }
  }

  public async handler(
    job: Job<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      string
    >,
  ) {
    const jobType = job.name as JobTypes

    await this.doWork(
      jobType,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      job.data,
    )
  }
}

const background = new Background()
export default background

export async function stopBackgroundWorkers() {
  await Promise.all(background.workers.map(worker => worker.close()))
}

export type BackgroundQueuePriority = 'default' | 'urgent' | 'not_urgent' | 'last'

// /**
//  * @internal
//  *
//  * Returns either the namedNativeBullMQWorkers, or else the translated form of the
//  * namedWorkstreams arg, or else a blank array
//  */
// public namedBackgroundWorkerOptions(): BullmqProWorkerOptions[] {
//   const nativeOpts = this.backgroundOptions
//   if (nativeOpts.namedNativeBullMQWorkers) {
//     return nativeOpts.namedNativeBullMQWorkers
//   }

//   const simpleOpts = this.backgroundOptions as PsychicBackgroundSimpleOptions
//   if (simpleOpts.namedWorkstreams) {
//     return simpleOpts.namedWorkstreams.map(workstreamOpts =>
//       this.transformWorkstreamOptsToWorkerOpts(workstreamOpts),
//     )
//   }

//   return []
// }

// /**
//  * @internal
//  *
//  * Translates provided namedWorkstream option into
//  * a BullmqProWorkerOptions object, used by
//  * #namedBackgroundWorkerOptions to build worker options
//  * to provide to BullMQ (or BullMQ Pro).
//  */
// private transformWorkstreamOptsToWorkerOpts(
//   workstreamOpts: PsychicBackgroundWorkstreamOptions,
// ): BullmqProWorkerOptions {
//   if (!workstreamOpts.name && workstreamOpts.rateLimit)
//     throw new Error(`Must provide name when providing rateLimit`)

//   return {
//     group: {
//       id: workstreamOpts.name,
//       limit: workstreamOpts.rateLimit,
//     },
//   }
// }

function nameToRedisQueueName(queueName: string, redis: Redis | Cluster): string {
  queueName = queueName.replace(/\{|\}/g, '')
  if (redis instanceof Cluster) return `{${queueName}}`
  return queueName
}

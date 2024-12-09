import { Dream, IdType, pascalize, testEnv } from '@rvohealth/dream'
import { Job, Queue, QueueEvents, QueueOptions, Worker } from 'bullmq'
import Redis, { Cluster } from 'ioredis'
import NoQueueForSpecifiedQueueName from '../error/background/NoQueueForSpecifiedQueueName'
import NoQueueForSpecifiedWorkstream from '../error/background/NoQueueForSpecifiedWorkstream'
import { devEnvBool } from '../helpers/envValue'
import PsychicApplication, {
  BullMQNativeWorkerOptions,
  PsychicBackgroundNativeBullMQOptions,
  PsychicBackgroundSimpleOptions,
  PsychicBackgroundWorkstreamOptions,
  QueueOptionsWithConnectionInstance,
  TransitionalPsychicBackgroundSimpleOptions,
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

  public defaultQueue: Queue | null = null
  public namedQueues: Record<string, Queue> = {}
  private queueNameMap: Record<string, string> = {}
  private queueEvents: QueueEvents[] = []
  public workers: Worker[] = []

  public connect({
    activateWorkers = false,
  }: {
    activateWorkers?: boolean
  } = {}) {
    if (testEnv() && !devEnvBool('REALLY_TEST_BACKGROUND_QUEUE')) return
    if (this.defaultQueue) return

    const psychicApp = PsychicApplication.getOrFail()
    const defaultBullMQQueueOptions = psychicApp.backgroundOptions.defaultBullMQQueueOptions || {}

    if ((psychicApp.backgroundOptions as PsychicBackgroundNativeBullMQOptions).nativeBullMQ) {
      this.nativeBullMQConnect(
        defaultBullMQQueueOptions,
        psychicApp.backgroundOptions as PsychicBackgroundNativeBullMQOptions,
        { activateWorkers },
      )
    } else {
      this.simpleConnect(
        defaultBullMQQueueOptions,
        psychicApp.backgroundOptions as PsychicBackgroundSimpleOptions,
        { activateWorkers },
      )
    }
  }

  private simpleConnect(
    defaultBullMQQueueOptions: Omit<QueueOptions, 'connection'>,
    backgroundOptions: PsychicBackgroundSimpleOptions | TransitionalPsychicBackgroundSimpleOptions,

    {
      activateWorkers = false,
      activatingTransitionalWorkstreams = false,
    }: {
      activateWorkers?: boolean
      activatingTransitionalWorkstreams?: boolean
    },
  ) {
    /////////////////////////////////
    // Psychic background options //
    /////////////////////////////////
    const defaultConnection = backgroundOptions.connection
    const formattedQueueName = nameToRedisQueueName(
      activatingTransitionalWorkstreams
        ? `Transitional${Background.defaultQueueName}`
        : Background.defaultQueueName,
      defaultConnection,
    )

    ///////////////////////////////
    // create default workstream //
    ///////////////////////////////

    const defaultQueue = new Background.Queue(formattedQueueName, {
      ...defaultBullMQQueueOptions,
      connection: defaultConnection,
    })
    this.queueEvents.push(new Background.QueueEvents(formattedQueueName, { connection: defaultConnection }))
    if (!activatingTransitionalWorkstreams) this.defaultQueue = defaultQueue
    ////////////////////////////////////
    // end: create default workstream //
    ////////////////////////////////////

    /////////////////////////////
    // create default workers //
    /////////////////////////////
    if (activateWorkers) {
      for (let i = 0; i < (backgroundOptions.defaultWorkstream?.workerCount || 1); i++) {
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
        activatingTransitionalWorkstreams ? `Transitional${namedWorkstream.name}` : namedWorkstream.name,
        namedWorkstreamConnection,
      )

      const namedQueue = new Background.Queue(namedWorkstreamFormattedQueueName, {
        ...defaultBullMQQueueOptions,
        connection: namedWorkstreamConnection,
      })

      if (!activatingTransitionalWorkstreams) {
        this.queueNameMap[namedWorkstream.name] = namedWorkstreamFormattedQueueName
        this.namedQueues[namedWorkstream.name] = namedQueue
      }

      this.queueEvents.push(
        new Background.QueueEvents(namedWorkstreamFormattedQueueName, {
          connection: namedWorkstreamConnection,
        }),
      )

      //////////////////////////
      // create named workers //
      //////////////////////////
      if (activateWorkers) {
        for (let i = 0; i < (namedWorkstream.workerCount || 1); i++) {
          this.workers.push(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            new Background.Worker(namedWorkstreamFormattedQueueName, data => this.handler(data), {
              group: {
                id: namedWorkstream.name,
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

    const transitionalWorkstreams = (backgroundOptions as PsychicBackgroundSimpleOptions)
      .transitionalWorkstreams

    if (transitionalWorkstreams) {
      this.simpleConnect(defaultBullMQQueueOptions, transitionalWorkstreams, {
        activateWorkers,
        activatingTransitionalWorkstreams: true,
      })
    }
  }

  private nativeBullMQConnect(
    defaultBullMQQueueOptions: Omit<QueueOptions, 'connection'>,
    backgroundOptions: PsychicBackgroundNativeBullMQOptions,
    {
      activateWorkers = false,
    }: {
      activateWorkers?: boolean
    },
  ) {
    ///////////////////////////
    // native BullMQ options //
    ///////////////////////////

    const nativeBullMQ = backgroundOptions.nativeBullMQ
    const defaultConnection = nativeBullMQ.defaultQueueOptions?.connection || backgroundOptions.connection
    const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultConnection)

    //////////////////////////
    // create default queue //
    //////////////////////////
    this.defaultQueue = new Background.Queue(formattedQueueName, {
      ...defaultBullMQQueueOptions,
      ...(nativeBullMQ.defaultQueueOptions || {}),
      connection: defaultConnection,
    })
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
      this.queueNameMap[queueName] = formattedQueueName

      this.namedQueues[queueName] = new Background.Queue(formattedQueuename, {
        ...defaultBullMQQueueOptions,
        ...namedQueueOptions,
        connection: namedQueueConnection,
      })
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
      jobConfig = {},
    }: {
      globalName: string
      filepath?: string
      delaySeconds?: number
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      jobConfig?: BackgroundJobConfig
    },
  ) {
    this.connect()

    await this._addToQueue(
      `BackgroundJobQueueStaticJob`,
      {
        globalName,
        method,
        args,
      },
      {
        delaySeconds,
        jobConfig: jobConfig,
        groupId: this.jobConfigToGroupId(jobConfig),
        priority: this.jobConfigToPriority(jobConfig),
      },
    )
  }

  public async scheduledMethod(
    ObjectClass: Record<'name', string>,
    pattern: string,
    method: string,
    {
      globalName,
      args = [],
      jobConfig = {},
    }: {
      globalName: string
      filepath?: string
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      jobConfig?: BackgroundJobConfig
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

    await this.queueInstance(jobConfig).add(
      'BackgroundJobQueueStaticJob',
      {
        globalName,
        method,
        args,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      {
        repeat: {
          pattern,
        },
        jobId,
        group: this.jobConfigToGroup(jobConfig),
        priority: this.mapPriorityWordToPriorityNumber(this.jobConfigToPriority(jobConfig)),
        // typing as any because Psychic can't be aware of BullMQ Pro options
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    )
  }

  private queueInstance(values: BackgroundJobConfig) {
    const workstreamConfig = values as WorkstreamBackgroundJobConfig
    const queueConfig = values as QueueBackgroundJobConfig
    const queueInstance: Queue | undefined = workstreamConfig.workstream
      ? this.namedQueues[this.queueNameMap[workstreamConfig.workstream]]
      : queueConfig.queue
        ? this.namedQueues[this.queueNameMap[queueConfig.queue]]
        : this.defaultQueue!

    if (!queueInstance) {
      if (workstreamConfig.workstream) throw new NoQueueForSpecifiedWorkstream(workstreamConfig.workstream)
      if (queueConfig.queue) throw new NoQueueForSpecifiedQueueName(queueConfig.queue)
    }

    return queueInstance
  }

  public async instanceMethod(
    ObjectClass: Record<'name', string>,
    method: string,
    {
      delaySeconds,
      globalName,
      args = [],
      constructorArgs = [],
      jobConfig = {},
    }: {
      globalName: string
      delaySeconds?: number
      filepath?: string
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructorArgs?: any[]
      jobConfig?: BackgroundJobConfig
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
      },
      {
        delaySeconds,
        jobConfig: jobConfig,
        groupId: this.jobConfigToGroupId(jobConfig),
        priority: this.jobConfigToPriority(jobConfig),
      },
    )
  }

  public async modelInstanceMethod(
    modelInstance: Dream,
    method: string,
    {
      delaySeconds,
      args = [],
      jobConfig = {},
    }: {
      delaySeconds?: number
      importKey?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args?: any[]
      jobConfig?: BackgroundJobConfig
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
      },
      {
        delaySeconds,
        jobConfig: jobConfig,
        groupId: this.jobConfigToGroupId(jobConfig),
        priority: this.jobConfigToPriority(jobConfig),
      },
    )
  }

  // should be private, but public so we can test
  public async _addToQueue(
    jobType: JobTypes,
    jobData: BackgroundJobData,
    {
      delaySeconds,
      jobConfig,
      priority,
      groupId,
    }: {
      delaySeconds?: number
      jobConfig: BackgroundJobConfig
      priority: BackgroundQueuePriority
      groupId?: string
    },
  ) {
    // set this variable out side of the conditional so that
    // mismatches will raise exceptions even in tests
    const queueInstance = this.queueInstance(jobConfig)

    if (testEnv() && !devEnvBool('REALLY_TEST_BACKGROUND_QUEUE')) {
      await this.doWork(jobType, jobData)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await queueInstance.add(jobType, jobData, {
        delay: delaySeconds ? delaySeconds * 1000 : undefined,
        group: this.groupIdToGroupConfig(groupId),
        priority: this.mapPriorityWordToPriorityNumber(priority),
        // typing as any because Psychic can't be aware of BullMQ Pro options
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    }
  }

  private jobConfigToPriority(jobConfig?: BackgroundJobConfig): BackgroundQueuePriority {
    if (!jobConfig) return 'default'
    return jobConfig.priority || 'default'
  }

  private jobConfigToGroupId(jobConfig?: BackgroundJobConfig): string | undefined {
    if (!jobConfig) return

    const workstreamConfig = jobConfig as WorkstreamBackgroundJobConfig
    if (workstreamConfig.workstream) return workstreamConfig.workstream

    const queueConfig = jobConfig as QueueBackgroundJobConfig
    if (queueConfig.groupId) return queueConfig.groupId

    return
  }

  private jobConfigToGroup(jobConfig?: BackgroundJobConfig): { id: string } | undefined {
    return this.groupIdToGroupConfig(this.jobConfigToGroupId(jobConfig))
  }

  private groupIdToGroupConfig(groupId: string | undefined): { id: string } | undefined {
    if (!groupId) return
    return { id: groupId }
  }

  private mapPriorityWordToPriorityNumber(priority: BackgroundQueuePriority) {
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

interface BaseBackgroundJobConfig {
  priority?: BackgroundQueuePriority
}

export interface WorkstreamBackgroundJobConfig extends BaseBackgroundJobConfig {
  groupId?: never
  queue?: never
  workstream?: string
}

export interface QueueBackgroundJobConfig extends BaseBackgroundJobConfig {
  groupId?: string
  queue?: string
  workstream?: never
}

export type BackgroundJobConfig = WorkstreamBackgroundJobConfig | QueueBackgroundJobConfig

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

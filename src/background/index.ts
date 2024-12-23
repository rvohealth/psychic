import { Dream, IdType, pascalize, testEnv } from '@rvohealth/dream'
import { Job, JobsOptions, Queue, QueueEvents, QueueOptions, Worker, WorkerOptions } from 'bullmq'
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
import { Either } from '../psychic-application/types'

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

class DefaultBullMQNativeOptionsMissingConnectionAndDefaultConnection extends Error {
  public get message() {
    return `
Native BullMQ options don't include a default connection, and the
default queue does not include a connection
`
  }
}

class NamedBullMQNativeOptionsMissingConnectionAndDefaultConnection extends Error {
  constructor(private queueName: string) {
    super()
  }

  public get message() {
    return `
Native BullMQ options don't include a default connection, and the
${this.queueName} queue does not include a connection
`
  }
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

  /**
   * Used when adding jobs to the default queue
   */
  public defaultQueue: Queue | null = null
  /**
   * Used when adding jobs to the default transitional queue
   */
  public defaultTransitionalQueue: Queue | null = null
  /**
   * Used when adding jobs to a named queue
   */
  public namedQueues: Record<string, Queue> = {}
  /**
   * Used when adding jobs to a named transitioanl queue
   */
  public namedTransitionalQueues: Record<string, Queue> = {}
  /**
   * Queue event emitters for all queues https://docs.bullmq.io/guide/events
   */
  public queueEvents: QueueEvents[] = []
  public workers: Worker[] = []

  public connect({
    activateWorkers = false,
  }: {
    activateWorkers?: boolean
  } = {}) {
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
    const defaultConnection = backgroundOptions.defaultConnection
    // transitional queues must have the same names they had prior to making them
    // transitional since the name is what identifies the queues and enables the
    // queues to be worked off
    const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultConnection)

    ///////////////////////////////
    // create default workstream //
    ///////////////////////////////

    const defaultQueue = new Background.Queue(formattedQueueName, {
      ...defaultBullMQQueueOptions,
      connection: defaultConnection,
    })
    this.queueEvents.push(new Background.QueueEvents(formattedQueueName, { connection: defaultConnection }))
    if (activatingTransitionalWorkstreams) {
      this.defaultTransitionalQueue = defaultQueue
    } else {
      this.defaultQueue = defaultQueue
    }
    ////////////////////////////////////
    // end: create default workstream //
    ////////////////////////////////////

    /////////////////////////////
    // create default workers //
    /////////////////////////////
    if (activateWorkers) {
      for (let i = 0; i < (backgroundOptions.defaultWorkstream?.workerCount ?? 1); i++) {
        this.workers.push(
          new Background.Worker(formattedQueueName, job => this.doWork(job), {
            connection: defaultConnection,
            concurrency: backgroundOptions.defaultWorkstream?.concurrency || 1,
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
      // transitional queues must have the same names they had prior to making them
      // transitional since the name is what identifies the queues and enables the
      // queues to be worked off
      const namedWorkstreamFormattedQueueName = nameToRedisQueueName(
        namedWorkstream.name,
        namedWorkstreamConnection,
      )

      const namedQueue = new Background.Queue(namedWorkstreamFormattedQueueName, {
        ...defaultBullMQQueueOptions,
        connection: namedWorkstreamConnection,
      })

      if (activatingTransitionalWorkstreams) {
        this.namedTransitionalQueues[namedWorkstream.name] = namedQueue
      } else {
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
        for (let i = 0; i < (namedWorkstream.workerCount ?? 1); i++) {
          this.workers.push(
            new Background.Worker(namedWorkstreamFormattedQueueName, job => this.doWork(job), {
              group: {
                id: namedWorkstream.name,
                limit: namedWorkstream.rateLimit,
              },
              connection: namedWorkstreamConnection,
              concurrency: namedWorkstream.concurrency || 1,
              // explicitly typing as WorkerOptions because Psychic can't be aware of BullMQ Pro options
            } as WorkerOptions),
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
    const nativeBullMQ = backgroundOptions.nativeBullMQ
    const defaultQueueConnection =
      nativeBullMQ.defaultQueueOptions?.connection || backgroundOptions.defaultConnection

    if (!defaultQueueConnection) throw new DefaultBullMQNativeOptionsMissingConnectionAndDefaultConnection()

    const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultQueueConnection)

    //////////////////////////
    // create default queue //
    //////////////////////////
    this.defaultQueue = new Background.Queue(formattedQueueName, {
      ...defaultBullMQQueueOptions,
      ...(nativeBullMQ.defaultQueueOptions || {}),
      connection: defaultQueueConnection,
    })
    this.queueEvents.push(
      new Background.QueueEvents(formattedQueueName, { connection: defaultQueueConnection }),
    )
    ///////////////////////////////
    // end: create default queue //
    ///////////////////////////////

    /////////////////////////////
    // create default workers //
    /////////////////////////////
    if (activateWorkers) {
      for (let i = 0; i < (nativeBullMQ.defaultWorkerCount ?? 1); i++) {
        this.workers.push(
          new Background.Worker(formattedQueueName, job => this.doWork(job), {
            ...(backgroundOptions.nativeBullMQ.defaultWorkerOptions || {}),
            connection: defaultQueueConnection,
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
      const namedQueueConnection = namedQueueOptions.connection || backgroundOptions.defaultConnection

      if (!namedQueueConnection)
        throw new NamedBullMQNativeOptionsMissingConnectionAndDefaultConnection(queueName)

      const formattedQueuename = nameToRedisQueueName(queueName, namedQueueConnection)

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
        const extraWorkerOptionsMap: Record<string, BullMQNativeWorkerOptions> =
          nativeBullMQ.namedQueueWorkers || {}
        const extraWorkerOptions: BullMQNativeWorkerOptions = extraWorkerOptionsMap[queueName]
        const extraWorkerCount = extraWorkerOptions ? (extraWorkerOptions.workerCount ?? 1) : 0

        for (let i = 0; i < extraWorkerCount; i++) {
          this.workers.push(
            new Background.Worker(formattedQueuename, job => this.doWork(job), {
              ...extraWorkerOptions,
              connection: namedQueueConnection,
            }),
          )
        }
      }
      ///////////////////////////////
      // end: create extra workers //
      ///////////////////////////////
    })
    //////////////////////////////
    // end: create named queues //
    //////////////////////////////
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
      {
        repeat: {
          pattern,
        },
        jobId,
        group: this.jobConfigToGroup(jobConfig),
        priority: this.mapPriorityWordToPriorityNumber(this.jobConfigToPriority(jobConfig)),
        // explicitly typing as JobsOptions because Psychic can't be aware of BullMQ Pro options
      } as JobsOptions,
    )
  }

  private queueInstance(values: BackgroundJobConfig) {
    const workstreamConfig = values as WorkstreamBackgroundJobConfig
    const queueConfig = values as QueueBackgroundJobConfig
    const queueInstance: Queue | undefined = workstreamConfig.workstream
      ? this.namedQueues[workstreamConfig.workstream]
      : queueConfig.queue
        ? this.namedQueues[queueConfig.queue]
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
    const delay = delaySeconds ? delaySeconds * 1000 : undefined

    if (testEnv() && !devEnvBool('REALLY_TEST_BACKGROUND_QUEUE')) {
      const queue = new Background.Queue('TestQueue', { connection: {} })
      const job = new Job(queue, jobType, jobData, {})
      await this.doWork(job)
      //
    } else if (groupId && priority) {
      await queueInstance.add(jobType, jobData, {
        delay,
        group: {
          ...this.groupIdToGroupConfig(groupId),
          priority: this.mapPriorityWordToPriorityNumber(priority),
        },
        // explicitly typing as JobsOptions because Psychic can't be aware of BullMQ Pro options
      } as JobsOptions)
      //
    } else {
      await queueInstance.add(jobType, jobData, {
        delay,
        group: this.groupIdToGroupConfig(groupId),
        priority: this.mapPriorityWordToPriorityNumber(priority),
        // explicitly typing as JobsOptions because Psychic can't be aware of BullMQ Pro options
      } as JobsOptions)
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

  public async doWork(job: Job) {
    const jobType = job.name as JobTypes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { id, method, args, constructorArgs, globalName } = job.data as BackgroundJobData
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
        await objectClass[method!](...args, job)
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
          await instance[method!](...args, job)
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
          await (modelInstance as any)[method!](...args, job)
        }
        break
    }
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
  workstream?: string
}

export interface QueueBackgroundJobConfig extends BaseBackgroundJobConfig {
  groupId?: string
  queue?: string
}

export type BackgroundJobConfig = Either<WorkstreamBackgroundJobConfig, QueueBackgroundJobConfig>

export type PsychicBackgroundOptions =
  | (PsychicBackgroundSimpleOptions &
      Partial<
        Record<
          Exclude<keyof PsychicBackgroundNativeBullMQOptions, keyof PsychicBackgroundSimpleOptions>,
          never
        >
      >)
  | (PsychicBackgroundNativeBullMQOptions &
      Partial<
        Record<
          Exclude<keyof PsychicBackgroundSimpleOptions, keyof PsychicBackgroundNativeBullMQOptions>,
          never
        >
      >)

function nameToRedisQueueName(queueName: string, redis: Redis | Cluster): string {
  queueName = queueName.replace(/\{|\}/g, '')
  if (redis instanceof Cluster) return `{${queueName}}`
  return queueName
}

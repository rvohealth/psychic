import { closeAllDbConnections, compact, Dream, IdType, pascalize } from '@rvohealth/dream'
import { Job, JobsOptions, Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq'
import Redis, { Cluster } from 'ioredis'
import NoQueueForSpecifiedQueueName from '../error/background/NoQueueForSpecifiedQueueName'
import NoQueueForSpecifiedWorkstream from '../error/background/NoQueueForSpecifiedWorkstream'
import EnvInternal from '../helpers/EnvInternal'
import PsychicApplication, {
  BullMQNativeWorkerOptions,
  PsychicBackgroundNativeBullMQOptions,
  PsychicBackgroundSimpleOptions,
  PsychicBackgroundWorkstreamOptions,
  QueueOptionsWithConnectionInstance,
  RedisOrRedisClusterConnection,
  TransitionalPsychicBackgroundSimpleOptions,
} from '../psychic-application'
import lookupClassByGlobalName from '../psychic-application/helpers/lookupClassByGlobalName'
import { Either } from '../psychic-application/types'
import BaseBackgroundedService from './BaseBackgroundedService'
import BaseScheduledService from './BaseScheduledService'

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

class DefaultBullMQNativeOptionsMissingQueueConnectionAndDefaultQueueConnection extends Error {
  public get message() {
    return `
Native BullMQ options don't include a default queue connection, and the
default config does not include a queue connection
`
  }
}

class NamedBullMQNativeOptionsMissingQueueConnectionAndDefaultQueueConnection extends Error {
  constructor(private queueName: string) {
    super()
  }

  public get message() {
    return `
Native BullMQ options don't include a default queue connection, and the
${this.queueName} queue does not include a queue connection
`
  }
}

class ActivatingBackgroundWorkersWithoutDefaultWorkerConnection extends Error {
  public get message() {
    return `
defaultWorkerConnection is required when activating workers. For example,
it may be omitted on webserver instances, but is required on worker instances.
`
  }
}

class ActivatingNamedQueueBackgroundWorkersWithoutWorkerConnection extends Error {
  constructor(private queueName: string) {
    super()
  }

  public get message() {
    return `
defaultWorkerConnection is missing, and the ${this.queueName} queue does not
specify a workerConnection. A worker connection isrequired when activating workers.
For example, it may be omitted on webserver instances, but is required on worker instances.
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

  /**
   * Used when adding jobs to the default queue
   */
  private defaultQueue: Queue | null = null
  /**
   * Used when adding jobs to the default transitional queue
   */
  private defaultTransitionalQueue: Queue | null = null
  /**
   * Used when adding jobs to a named queue
   */
  private namedQueues: Record<string, Queue> = {}

  private groupNames: Record<string, string[]> = {}

  private workstreamNames: string[] = []

  /**
   * Used when adding jobs to a named transitioanl queue
   */
  private namedTransitionalQueues: Record<string, Queue> = {}

  private _workers: Worker[] = []

  private redisConnections: RedisOrRedisClusterConnection[] = []

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

  public get queues() {
    return compact([
      this.defaultQueue,
      ...Object.values(this.namedQueues).map(queue => queue),
      this.defaultTransitionalQueue,
      ...Object.values(this.namedTransitionalQueues).map(queue => queue),
    ])
  }

  public get workers() {
    return [...this._workers]
  }

  private async shutdownAndExit() {
    await this.shutdown()
    process.exit()
  }

  public async shutdown() {
    await Promise.all(this._workers.map(worker => worker.close()))

    const psychicApp = PsychicApplication.getOrFail()
    for (const hook of psychicApp.specialHooks.workerShutdown) {
      await hook()
    }

    await closeAllDbConnections()
    await this.closeAllRedisConnections()
  }

  public async closeAllRedisConnections() {
    for (const queue of this.queues) {
      await queue.close()
    }

    for (const worker of this.workers) {
      await worker.close()
    }

    for (const connection of this.redisConnections) {
      try {
        connection.disconnect()
      } catch {
        // noop
      }
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
    const defaultQueueConnection = backgroundOptions.defaultQueueConnection
    const defaultWorkerConnection = backgroundOptions.defaultWorkerConnection

    if (defaultQueueConnection) this.redisConnections.push(defaultQueueConnection)
    if (defaultWorkerConnection) this.redisConnections.push(defaultWorkerConnection)

    // transitional queues must have the same names they had prior to making them
    // transitional since the name is what identifies the queues and enables the
    // queues to be worked off
    const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultQueueConnection)

    ///////////////////////////////
    // create default workstream //
    ///////////////////////////////

    const defaultQueue = new Background.Queue(formattedQueueName, {
      ...defaultBullMQQueueOptions,
      connection: defaultQueueConnection,
    })

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
      if (!defaultWorkerConnection) throw new ActivatingBackgroundWorkersWithoutDefaultWorkerConnection()

      const workerCount = backgroundOptions.defaultWorkstream?.workerCount ?? 1
      for (let i = 0; i < workerCount; i++) {
        this._workers.push(
          new Background.Worker(formattedQueueName, job => this.doWork(job), {
            connection: defaultWorkerConnection,
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
      if (namedWorkstream.queueConnection) this.redisConnections.push(namedWorkstream.queueConnection)
      if (namedWorkstream.workerConnection) this.redisConnections.push(namedWorkstream.workerConnection)

      const namedWorkstreamQueueConnection = namedWorkstream.queueConnection || defaultQueueConnection
      const namedWorkstreamWorkerConnection = namedWorkstream.workerConnection || defaultWorkerConnection
      // transitional queues must have the same names they had prior to making them
      // transitional since the name is what identifies the queues and enables the
      // queues to be worked off
      const namedWorkstreamFormattedQueueName = nameToRedisQueueName(
        namedWorkstream.name,
        namedWorkstreamQueueConnection,
      )

      const namedQueue = new Background.Queue(namedWorkstreamFormattedQueueName, {
        ...defaultBullMQQueueOptions,
        connection: namedWorkstreamQueueConnection,
      })

      if (activatingTransitionalWorkstreams) {
        this.namedTransitionalQueues[namedWorkstream.name] = namedQueue
      } else {
        this.namedQueues[namedWorkstream.name] = namedQueue
        this.workstreamNames.push(namedWorkstream.name)
      }

      //////////////////////////
      // create named workers //
      //////////////////////////
      if (activateWorkers) {
        if (!namedWorkstreamWorkerConnection)
          throw new ActivatingNamedQueueBackgroundWorkersWithoutWorkerConnection(namedWorkstream.name)

        const workerCount = namedWorkstream.workerCount ?? 1
        for (let i = 0; i < workerCount; i++) {
          this._workers.push(
            new Background.Worker(namedWorkstreamFormattedQueueName, job => this.doWork(job), {
              group: {
                id: namedWorkstream.name,
                limit: namedWorkstream.rateLimit,
              },
              connection: namedWorkstreamWorkerConnection,
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
      nativeBullMQ.defaultQueueOptions?.queueConnection || backgroundOptions.defaultQueueConnection
    const defaultWorkerConnection =
      nativeBullMQ.defaultQueueOptions?.workerConnection || backgroundOptions.defaultWorkerConnection

    if (defaultQueueConnection) this.redisConnections.push(defaultQueueConnection)
    if (defaultWorkerConnection) this.redisConnections.push(defaultWorkerConnection)

    if (!defaultQueueConnection)
      throw new DefaultBullMQNativeOptionsMissingQueueConnectionAndDefaultQueueConnection()

    const formattedQueueName = nameToRedisQueueName(Background.defaultQueueName, defaultQueueConnection)

    //////////////////////////
    // create default queue //
    //////////////////////////
    this.defaultQueue = new Background.Queue(formattedQueueName, {
      ...defaultBullMQQueueOptions,
      ...(nativeBullMQ.defaultQueueOptions || {}),
      connection: defaultQueueConnection,
    })
    ///////////////////////////////
    // end: create default queue //
    ///////////////////////////////

    /////////////////////////////
    // create default workers //
    /////////////////////////////
    if (activateWorkers) {
      if (!defaultWorkerConnection) throw new ActivatingBackgroundWorkersWithoutDefaultWorkerConnection()

      const workerCount = nativeBullMQ.defaultWorkerCount ?? 1
      for (let i = 0; i < workerCount; i++) {
        this._workers.push(
          new Background.Worker(formattedQueueName, job => this.doWork(job), {
            ...(backgroundOptions.nativeBullMQ.defaultWorkerOptions || {}),
            connection: defaultWorkerConnection,
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

      if (namedQueueOptions.queueConnection) this.redisConnections.push(namedQueueOptions.queueConnection)
      if (namedQueueOptions.workerConnection) this.redisConnections.push(namedQueueOptions.workerConnection)

      const namedQueueConnection = namedQueueOptions.queueConnection || defaultQueueConnection
      const namedWorkerConnection = namedQueueOptions.workerConnection || defaultWorkerConnection

      if (!namedQueueConnection)
        throw new NamedBullMQNativeOptionsMissingQueueConnectionAndDefaultQueueConnection(queueName)

      const formattedQueuename = nameToRedisQueueName(queueName, namedQueueConnection)

      this.namedQueues[queueName] = new Background.Queue(formattedQueuename, {
        ...defaultBullMQQueueOptions,
        ...namedQueueOptions,
        connection: namedQueueConnection,
      })

      //////////////////////////
      // create extra workers //
      //////////////////////////
      const extraWorkerOptionsMap: Record<string, BullMQNativeWorkerOptions> =
        nativeBullMQ.namedQueueWorkers || {}
      const extraWorkerOptions: BullMQNativeWorkerOptions = extraWorkerOptionsMap[queueName]
      const extraWorkerCount = extraWorkerOptions ? (extraWorkerOptions.workerCount ?? 1) : 0

      this.groupNames[queueName] ||= []
      if (extraWorkerOptions.group?.id) this.groupNames[queueName].push(extraWorkerOptions.group.id)

      if (activateWorkers) {
        if (!namedWorkerConnection)
          throw new ActivatingNamedQueueBackgroundWorkersWithoutWorkerConnection(queueName)

        for (let i = 0; i < extraWorkerCount; i++) {
          this._workers.push(
            new Background.Worker(formattedQueuename, job => this.doWork(job), {
              ...extraWorkerOptions,
              connection: namedWorkerConnection,
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

    process.on('SIGTERM', () => {
      void this.shutdownAndExit()
    })

    process.on('SIGINT', () => {
      void this.shutdownAndExit()
    })
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobConfig?: BackgroundJobConfig<any>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobConfig?: BackgroundJobConfig<any>
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queueInstance(values: BackgroundJobConfig<any>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workstreamConfig = values as WorkstreamBackgroundJobConfig<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queueConfig = values as QueueBackgroundJobConfig<any>
    const queueInstance: Queue | undefined =
      typeof workstreamConfig.workstream === 'string'
        ? this.namedQueues[workstreamConfig.workstream]
        : typeof queueConfig.queue === 'string'
          ? this.namedQueues[queueConfig.queue]
          : this.defaultQueue!

    if (!queueInstance) {
      if (typeof workstreamConfig.workstream === 'string')
        throw new NoQueueForSpecifiedWorkstream(workstreamConfig.workstream)
      if (typeof queueConfig.queue === 'string') throw new NoQueueForSpecifiedQueueName(queueConfig.queue)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobConfig?: BackgroundJobConfig<any>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobConfig?: BackgroundJobConfig<any>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobConfig: BackgroundJobConfig<any>
      priority: BackgroundQueuePriority
      groupId?: string
    },
  ) {
    // set this variable out side of the conditional so that
    // mismatches will raise exceptions even in tests
    const queueInstance = this.queueInstance(jobConfig)
    const delay = delaySeconds ? delaySeconds * 1000 : undefined

    if (EnvInternal.isTest && !EnvInternal.boolean('REALLY_TEST_BACKGROUND_QUEUE')) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jobConfigToPriority(jobConfig?: BackgroundJobConfig<any>): BackgroundQueuePriority {
    if (!jobConfig) return 'default'
    return jobConfig.priority || 'default'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jobConfigToGroupId(jobConfig?: BackgroundJobConfig<any>): string | undefined {
    if (!jobConfig) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workstreamConfig = jobConfig as WorkstreamBackgroundJobConfig<any>
    if (typeof workstreamConfig.workstream === 'string') return workstreamConfig.workstream

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queueConfig = jobConfig as QueueBackgroundJobConfig<any>
    if (typeof queueConfig.groupId === 'string') return queueConfig.groupId

    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jobConfigToGroup(jobConfig?: BackgroundJobConfig<any>): { id: string } | undefined {
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
  await background.shutdown()
}

export type BackgroundQueuePriority = 'default' | 'urgent' | 'not_urgent' | 'last'

interface BaseBackgroundJobConfig {
  priority?: BackgroundQueuePriority
}

export interface WorkstreamBackgroundJobConfig<T extends BaseScheduledService | BaseBackgroundedService>
  extends BaseBackgroundJobConfig {
  workstream?: T['psychicTypes']['workstreamNames'][number]
}

export interface QueueBackgroundJobConfig<
  T extends BaseScheduledService | BaseBackgroundedService,
  PsyTypes extends T['psychicTypes'] = T['psychicTypes'],
  QueueGroupMap = PsyTypes['queueGroupMap'],
  Queue extends keyof QueueGroupMap = keyof QueueGroupMap,
  Groups extends QueueGroupMap[Queue] = QueueGroupMap[Queue],
  GroupId = Groups[number & keyof Groups],
> extends BaseBackgroundJobConfig {
  groupId?: GroupId
  queue?: Queue
}

export type BackgroundJobConfig<T extends BaseScheduledService | BaseBackgroundedService> = Either<
  WorkstreamBackgroundJobConfig<T>,
  QueueBackgroundJobConfig<T>
>

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

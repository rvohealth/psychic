import { Dream, IdType, pascalize, testEnv } from '@rvohealth/dream'
import { ConnectionOptions, Job, Queue, QueueEvents, Worker } from 'bullmq'
import { devEnvBool } from '../helpers/envValue'
import PsychicApplication from '../psychic-application'
import lookupClassByGlobalName from '../psychic-application/helpers/lookupClassByGlobalName'
import redisOptions from '../psychic-application/helpers/redisOptions'

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

  public queue: Queue | null = null
  public queueEvents: QueueEvents
  public workers: Worker[] = []
  public extraWorkers: Worker[] = []

  public connect() {
    if (testEnv() && !devEnvBool('REALLY_TEST_BACKGROUND_QUEUE')) return
    if (this.queue) return

    const psychicApp = PsychicApplication.getOrFail()

    if (!psychicApp?.useRedis)
      throw new Error(`attempting to use background jobs, but config.useRedis is not set to true.`)

    const queueOptions = psychicApp.backgroundQueueOptions()

    const bullConnectionOpts = this.bullConnectionOptions

    this.queue ||= new Background.Queue(Background.defaultQueueName, {
      ...queueOptions,
      connection: bullConnectionOpts,
    })
    this.queueEvents = new Background.QueueEvents(this.queue.name, {
      connection: bullConnectionOpts,
    })
  }

  private get bullConnectionOptions(): ConnectionOptions {
    const connectionOptions = redisOptions('background_jobs')
    return {
      host: connectionOptions.host,
      username: connectionOptions.username,
      password: connectionOptions.password,
      port: connectionOptions.port ? parseInt(connectionOptions.port) : undefined,
      tls: connectionOptions.secure
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
      connectTimeout: 5000,
    }
  }

  public work() {
    this.connect()

    const psychicApp = PsychicApplication.getOrFail()
    const defaultWorkerOptions = psychicApp.defaultBackgroundWorkerOptions()

    for (let i = 0; i < workerCount(); i++) {
      this.workers.push(
        new Background.Worker(Background.defaultQueueName, data => this.handler(data), {
          ...defaultWorkerOptions,
          connection: this.bullConnectionOptions,
        }),
      )
    }

    const extraWorkerOptions = psychicApp.namedBackgroundWorkerOptions()
    extraWorkerOptions.forEach(opts => {
      this.extraWorkers.push(
        new Background.Worker(Background.defaultQueueName, data => this.handler(data), {
          ...opts,
          connection: this.bullConnectionOptions,
        }),
      )
    })
  }

  public get allWorkers() {
    return [...this.workers, ...this.extraWorkers]
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

function workerCount() {
  const psychicApp = PsychicApplication.getOrFail()
  const providedWorkerCount = psychicApp.backgroundOptions.defaultWorkerCount
  if (providedWorkerCount !== undefined) return providedWorkerCount
  return 1
}

const background = new Background()
export default background

export async function stopBackgroundWorkers() {
  await Promise.all(background.allWorkers.map(worker => worker.close()))
}

export type BackgroundQueuePriority = 'default' | 'urgent' | 'not_urgent' | 'last'

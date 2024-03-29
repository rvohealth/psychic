import { ConnectionOptions, Job, Queue, QueueEvents, QueueOptions, Worker, WorkerOptions } from 'bullmq'
import readAppConfig from '../config/helpers/readAppConfig'
import { Dream, loadModels, pascalize } from '@rvohealth/dream'
import getModelKey from '../config/helpers/getModelKey'
import importFileWithDefault from '../helpers/importFileWithDefault'
import importFileWithNamedExport from '../helpers/importFileWithNamedExport'
import redisOptions, { PsychicRedisConnectionOptions } from '../config/helpers/redisOptions'
import developmentOrTestEnv from '../../boot/cli/helpers/developmentOrTestEnv'
import absoluteFilePath from '../helpers/absoluteFilePath'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import PsychicConfig from '../config'

type JobTypes =
  | 'BackgroundJobQueueFunctionJob'
  | 'BackgroundJobQueueStaticJob'
  | 'BackgroundJobQueueInstanceJob'
  | 'BackgroundJobQueueModelInstanceJob'

export interface BackgroundJobData {
  id?: any
  method?: any
  args: any
  constructorArgs?: any
  filepath: string
  importKey: any
  priority: BackgroundQueuePriority
}

export class Background {
  public queue: Queue | null = null
  public queueEvents: QueueEvents
  public workers: Worker[] = []

  public async connect() {
    if (process.env.NODE_ENV === 'test' && process.env.REALLY_TEST_BACKGROUND_QUEUE !== '1') return
    if (this.queue) return

    const appConfig = await readAppConfig()

    // ensure models are loaded, since otherwise we will not properly
    // boot our STI configurations within dream
    await loadModels()

    if (!appConfig?.redis) throw `attempting to use background jobs, but config.useRedis is not set to true.`

    const getConnectionOptions = await redisOptions('background_jobs')
    const connectionOptions = (await getConnectionOptions()) as PsychicRedisConnectionOptions
    const bullConnectionOpts = {
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
    } as ConnectionOptions

    const psyConf = await PsychicConfig.bootForReading()
    const queueOptions = psyConf.backgroundQueueOptions

    this.queue ||= new Queue(`${pascalize(appConfig.name)}BackgroundJobQueue`, {
      ...queueOptions,
      connection: bullConnectionOpts,
    })
    this.queueEvents = new QueueEvents(this.queue.name, { connection: bullConnectionOpts })

    const workerOptions = psyConf.backgroundWorkerOptions

    for (let i = 0; i < workerCount(); i++) {
      this.workers.push(
        new Worker(`${pascalize(appConfig.name)}BackgroundJobQueue`, data => this.handler(data), {
          ...workerOptions,
          connection: bullConnectionOpts,
        })
      )
    }
  }

  public async func({
    delaySeconds,
    filepath, // filepath means a file within the app that is consuming psychic
    importKey,
    args = [],
    priority = 'default',
  }: {
    delaySeconds?: number
    filepath: string
    importKey: string
    args?: any[]
    priority?: BackgroundQueuePriority
  }) {
    await this.connect()
    await this._addToQueue(
      'BackgroundJobQueueFunctionJob',
      {
        filepath: trimFilepath(filepath),
        importKey,
        args,
        priority,
      },
      { delaySeconds }
    )
  }

  public async staticMethod(
    ObjectClass: any,
    method: string,
    {
      delaySeconds,
      filepath, // filepath means a file within the app that is consuming psychic
      importKey,
      args = [],
      priority = 'default',
    }: {
      delaySeconds?: number
      filepath: string
      importKey?: string
      args?: any[]
      priority?: BackgroundQueuePriority
    }
  ) {
    await this.connect()
    await this._addToQueue(
      `BackgroundJobQueueStaticJob`,
      {
        filepath: trimFilepath(filepath),
        importKey,
        method,
        args,
        priority,
      },
      { delaySeconds }
    )
  }

  public async scheduledMethod(
    ObjectClass: any,
    pattern: string,
    method: string,
    {
      filepath, // filepath means a file within the app that is consuming psychic
      importKey,
      args = [],
      priority = 'default',
    }: {
      filepath: string
      importKey?: string
      args?: any[]
      priority?: BackgroundQueuePriority
    }
  ) {
    await this.connect()

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
        filepath: trimFilepath(filepath),
        importKey,
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
      }
    )
  }

  public async instanceMethod(
    ObjectClass: any,
    method: string,
    {
      delaySeconds,
      filepath, // filepath means a file within the app that is consuming psychic
      importKey,
      args = [],
      constructorArgs = [],
      priority = 'default',
    }: {
      delaySeconds?: number
      filepath: string
      importKey?: string
      args?: any[]
      constructorArgs?: any[]
      priority?: BackgroundQueuePriority
    }
  ) {
    await this.connect()
    await this._addToQueue(
      'BackgroundJobQueueInstanceJob',
      {
        filepath: trimFilepath(filepath),
        importKey,
        method,
        args,
        constructorArgs,
        priority,
      },
      { delaySeconds }
    )
  }

  public async modelInstanceMethod(
    modelInstance: Dream,
    method: string,
    {
      delaySeconds,
      importKey,
      args = [],
      priority = 'default',
    }: {
      delaySeconds?: number
      importKey?: string
      args?: any[]
      priority?: BackgroundQueuePriority
    }
  ) {
    await this.connect()
    const modelPath = await getModelKey(modelInstance.constructor as typeof Dream)
    await this._addToQueue(
      'BackgroundJobQueueModelInstanceJob',
      {
        id: modelInstance.primaryKeyValue,
        filepath: `app/models/${modelPath}`,
        importKey,
        method,
        args,
        priority,
      },
      { delaySeconds }
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
    }
  ) {
    if (process.env.NODE_ENV === 'test' && process.env.REALLY_TEST_BACKGROUND_QUEUE !== '1') {
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
    { id, method, args, constructorArgs, filepath, importKey }: BackgroundJobData
  ) {
    switch (jobType) {
      case 'BackgroundJobQueueFunctionJob':
        if (filepath) {
          const func = await importFileWithNamedExport(absoluteFilePath(filepath), importKey)

          if (!func) return

          await func(...args)
        }
        break

      case 'BackgroundJobQueueStaticJob':
        if (filepath) {
          const ObjectClass = await importFileWithNamedExport(
            absoluteFilePath(filepath),
            importKey || 'default'
          )

          if (!ObjectClass) return

          await ObjectClass[method as string](...args)
        }
        break

      case 'BackgroundJobQueueInstanceJob':
        if (filepath) {
          const ObjectClass = await importFileWithNamedExport(
            absoluteFilePath(filepath),
            importKey || 'default'
          )
          if (!ObjectClass) return

          const instance = new ObjectClass(...constructorArgs)
          await instance[method as string](...args)
        }
        break

      case 'BackgroundJobQueueModelInstanceJob':
        if (filepath) {
          const DreamModelClass = (await importFileWithDefault(absoluteFilePath(filepath))) as
            | typeof Dream
            | undefined
          if (!DreamModelClass) return

          const modelInstance = await DreamModelClass.find(id)
          if (!modelInstance) return

          await (modelInstance as any)[method as string](...args)
        }
        break
    }
  }

  public async handler(job: Job<any, any, string>) {
    const jobType = job.name as JobTypes

    await this.doWork(jobType, job.data)
  }
}

function workerCount() {
  if (process.env.WORKER_COUNT) return parseInt(process.env.WORKER_COUNT)
  return developmentOrTestEnv() ? 1 : 0
}

function trimFilepath(filepath: string) {
  if (!process.env.APP_ROOT_PATH)
    throw `
      [Psychic:] Must set APP_ROOT_PATH before calling trimFilepath
    `

  const trimmed = filepath
    .replace(/^\//, '')
    .replace(process.env.APP_ROOT_PATH!.replace(/^\//, ''), '')
    .replace(/^\/?dist/, '')
    .replace(/\.[jt]s$/, '')

  return process.env.PSYCHIC_CORE_DEVELOPMENT === '1' ? trimmed.replace(/^test-app/, '') : trimmed
}

const background = new Background()
export default background

export async function stopBackgroundWorkers() {
  await Promise.all(background.workers.map(worker => worker.close()))
}

export type BackgroundQueuePriority = 'default' | 'urgent' | 'not_urgent' | 'last'

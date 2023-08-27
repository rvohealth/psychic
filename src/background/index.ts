import { ConnectionOptions, Job, Queue, Worker } from 'bullmq'
import readAppConfig from '../config/helpers/readAppConfig'
import { Dream, pascalize } from 'dream'
import getModelKey from '../config/helpers/getModelKey'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import importFileWithNamedExport from '../helpers/importFileWithNamedExport'
import redisOptions, { PsychicRedisConnectionOptions } from '../config/helpers/redisOptions'
import developmentOrTestEnv from '../../boot/cli/helpers/developmentOrTestEnv'

type JobTypes =
  | 'BackgroundJobQueueStaticJob'
  | 'BackgroundJobQueueInstanceJob'
  | 'BackgroundJobQueueModelInstanceJob'

export interface BackgroundJobData {
  id?: any
  method: any
  args: any
  constructorArgs?: any
  filepath: string
  importKey: any
}

export class Background {
  public queue: Queue | null = null
  public workers: Worker[] = []

  public async connect() {
    if (process.env.NODE_ENV === 'test') return
    if (this.queue) return

    const appConfig = readAppConfig()

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

    this.queue ||= new Queue(`${pascalize(appConfig.name)}BackgroundJobQueue`, {
      connection: bullConnectionOpts,
    })

    for (let i = 0; i < workerCount(); i++) {
      this.workers.push(
        new Worker(`${pascalize(appConfig.name)}BackgroundJobQueue`, data => this.handler(data), {
          connection: bullConnectionOpts,
        })
      )
    }
  }

  public async staticMethod(
    ObjectClass: any,
    method: string,
    {
      filepath, // filepath means a file within the app that is consuming psychic
      importKey,
      args = [],
    }: {
      filepath: string
      importKey?: string
      args?: any[]
    }
  ) {
    await this.connect()
    await this.addToQueue(`BackgroundJobQueueStaticJob`, {
      filepath,
      importKey,
      method,
      args,
    })
  }

  public async instanceMethod(
    ObjectClass: any,
    method: string,
    {
      filepath, // filepath means a file within the app that is consuming psychic
      importKey,
      args = [],
      constructorArgs = [],
    }: {
      filepath: string
      importKey?: string
      args?: any[]
      constructorArgs?: any[]
    }
  ) {
    await this.connect()
    await this.addToQueue('BackgroundJobQueueInstanceJob', {
      filepath,
      importKey,
      method,
      args,
      constructorArgs,
    })
  }

  public async modelInstanceMethod(
    modelInstance: Dream,
    method: string,
    {
      importKey,
      args = [],
    }: {
      importKey?: string
      args?: any[]
    }
  ) {
    await this.connect()
    const modelPath = await getModelKey(modelInstance.constructor as typeof Dream)
    await this.addToQueue('BackgroundJobQueueModelInstanceJob', {
      id: modelInstance.primaryKeyValue,
      filepath: `app/models/${modelPath}`,
      importKey,
      method,
      args,
    })
  }

  private async addToQueue(jobType: JobTypes, jobData: BackgroundJobData) {
    if (process.env.NODE_ENV === 'test') await this.doWork(jobType, jobData)
    else {
      await this.queue!.add(jobType, jobData)
    }
  }

  public async doWork(
    jobType: JobTypes,
    { id, method, args, constructorArgs, filepath, importKey }: BackgroundJobData
  ) {
    const trimmedFilePath = filepath
      .replace(new RegExp(process.cwd()), '')
      .replace(/^\//, '')
      .replace(/\.[jt]s$/, '')

    switch (jobType) {
      case 'BackgroundJobQueueStaticJob':
        if (filepath) {
          const ObjectClass = await importFileWithNamedExport(
            absoluteSrcPath(trimmedFilePath),
            importKey || 'default'
          )

          if (!ObjectClass) return

          await ObjectClass[method as string](...args)
        }
        break

      case 'BackgroundJobQueueInstanceJob':
        if (trimmedFilePath) {
          const ObjectClass = await importFileWithNamedExport(
            absoluteSrcPath(trimmedFilePath),
            importKey || 'default'
          )
          if (!ObjectClass) return

          const instance = new ObjectClass(...constructorArgs)
          await instance[method as string](...args)
        }
        break

      case 'BackgroundJobQueueModelInstanceJob':
        if (trimmedFilePath) {
          const DreamModelClass = (await importFileWithDefault(absoluteSrcPath(trimmedFilePath))) as
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

const background = new Background()
export default background

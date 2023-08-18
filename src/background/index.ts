import { Job, Queue, Worker } from 'bullmq'
import redisOptions from '../config/helpers/redisOptions'
import readAppConfig from '../config/helpers/readAppConfig'
import { Dream } from 'dream'
import getModelKey from '../config/helpers/getModelKey'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import importFileWithNamedExport from '../helpers/importFileWithNamedExport'
import redisConnectionString from '../config/helpers/redisConnectionString'

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
  public worker: Worker | null = null

  public async connect() {
    if (process.env.NODE_ENV === 'test') return
    if (this.queue && this.worker) return

    const appConfig = readAppConfig()

    if (!appConfig?.redis) throw `attempting to use background jobs, but config.useRedis is not set to true.`

    const connectionString = await redisConnectionString('background_jobs')
    this.queue ||= new Queue('BackgroundJobQueue', connectionString as any)
    this.worker ||= new Worker('BackgroundJobQueue')
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
    await this.addToQueue('BackgroundJobQueueStaticJob', {
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
    else await this.queue!.add(jobType, jobData)
  }

  private async doWork(
    jobType: JobTypes,
    { id, method, args, constructorArgs, filepath, importKey }: BackgroundJobData
  ) {
    switch (jobType) {
      case 'BackgroundJobQueueStaticJob':
        if (filepath) {
          const ObjectClass = await importFileWithNamedExport(
            absoluteSrcPath(filepath),
            importKey || 'default'
          )

          if (!ObjectClass) return

          await ObjectClass[method as string](...args)
        }
        break

      case 'BackgroundJobQueueInstanceJob':
        if (filepath) {
          const ObjectClass = await importFileWithNamedExport(
            absoluteSrcPath(filepath),
            importKey || 'default'
          )
          if (!ObjectClass) return

          const instance = new ObjectClass(...constructorArgs)
          await instance[method as string](...args)
        }
        break

      case 'BackgroundJobQueueModelInstanceJob':
        if (filepath) {
          const DreamModelClass = (await importFileWithDefault(absoluteSrcPath(filepath))) as
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

const background = new Background()
export default background

import { Job, Queue, Worker } from 'bullmq'
import filePath from '../config/helpers/filePath'
import redisOptions from '../config/helpers/redisOptions'
import readAppConfig from '../config/helpers/readAppConfig'
import { DreamModel } from 'dream'
import getModelKey from '../config/helpers/getModelKey'

export class Background {
  public queue: Queue | null = null
  public worker: Worker | null = null

  public async connect() {
    if (this.queue && this.worker) return

    const appConfig = readAppConfig()

    if (!appConfig?.redis) throw `attempting to use background jobs, but config.useRedis is not set to true.`

    const connection = await redisOptions()
    this.queue ||= new Queue('BackgroundJobQueue', { connection })
    this.worker ||= new Worker('BackgroundJobQueue', job => this.handler(job), { connection })
  }

  public async staticMethod(
    ObjectClass: any,
    method: string,
    {
      filepath, // filepath means a file within the app that is consuming howl
      howlpath, // howlpath means a file within the howl infrastructure
      importKey,
      args = [],
    }: {
      filepath?: string
      howlpath?: string
      importKey?: string
      args?: any[]
    }
  ) {
    await this.connect()
    this.queue!.add('BackgroundJobQueueStaticJob', {
      className: ObjectClass.name,
      filepath,
      howlpath,
      importKey,
      method,
      args,
    })
  }

  public async instanceMethod(
    ObjectClass: any,
    method: string,
    {
      filepath, // filepath means a file within the app that is consuming howl
      howlpath, // howlpath means a file within the howl infrastructure
      importKey,
      args = [],
      constructorArgs = [],
    }: {
      filepath?: string
      howlpath?: string
      importKey?: string
      args?: any[]
      constructorArgs?: any[]
    }
  ) {
    await this.connect()
    this.queue!.add('BackgroundJobQueueInstanceJob', {
      className: ObjectClass.name,
      filepath,
      howlpath,
      importKey,
      method,
      args,
      constructorArgs,
    })
  }

  public async modelInstanceMethod(
    modelInstance: DreamModel<any, any>,
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
    const modelPath = await getModelKey(modelInstance.constructor as DreamModel<any, any>)
    this.queue!.add('BackgroundJobQueueModelInstanceJob', {
      className: modelInstance.constructor.name,
      id: (modelInstance as any)[(modelInstance.constructor as any).primaryKey].id,
      filepath: `app/models/${modelPath}`,
      importKey,
      method,
      args,
    })
  }

  public async handler(job: Job<any, any, string>) {
    const { id, method, args, constructorArgs, filepath, importKey } = job.data
    const jobType = job.name

    switch (jobType) {
      case 'BackgroundJobQueueStaticJob':
        if (filepath) {
          const ObjectClass = (await import(filePath(filepath)))?.[importKey || 'default']
          if (!ObjectClass) return

          await ObjectClass[method as string](...args)
        }
        break

      case 'BackgroundJobQueueInstanceJob':
        if (filepath) {
          const ObjectClass = (await import(filePath(filepath)))?.[importKey || 'default']
          if (!ObjectClass) return

          const instance = new ObjectClass(...constructorArgs)
          await instance[method as string](...args)
        }
        break

      case 'BackgroundJobQueueModelInstanceJob':
        if (filepath) {
          const HowlModelClass = (await import(filePath(filepath)))?.default as
            | DreamModel<any, any>
            | undefined
          if (!HowlModelClass) return

          const modelInstance = await HowlModelClass.find(id)
          if (!modelInstance) return

          await (modelInstance as any)[method as string](...args)
        }
        break
    }
  }
}

global.__howl_background_queue ||= new Background()
const background = global.__howl_background_queue

export default background

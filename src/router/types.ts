import PsychicController from '../controller/index.js.js'

export type ResourcesMethodType = 'index' | 'create' | 'update' | 'show' | 'destroy'
export const ResourcesMethods = ['index', 'create', 'update', 'show', 'destroy'] as ResourcesMethodType[]
export const ResourceMethods = ['create', 'update', 'show', 'destroy'] as ResourcesMethodType[]
export const HttpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options'] as const
export type HttpMethod = (typeof HttpMethods)[number]

export interface ResourcesOptions {
  only?: ResourcesMethodType[]
  except?: ResourcesMethodType[]
  controller?: typeof PsychicController
}

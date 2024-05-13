export type ResourcesMethodType = 'index' | 'create' | 'update' | 'show' | 'destroy'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options'

export const ResourcesMethods = ['index', 'create', 'update', 'show', 'destroy'] as ResourcesMethodType[]
export const ResourceMethods = ['create', 'update', 'show', 'destroy'] as ResourcesMethodType[]

export interface ResourcesOptions {
  only?: ResourcesMethodType[]
  except?: ResourcesMethodType[]
  controller?: string
}

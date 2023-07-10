export type ResourcesMethodType = 'index' | 'create' | 'update' | 'show' | 'delete'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export const ResourcesMethods = ['index', 'create', 'update', 'show', 'delete'] as ResourcesMethodType[]
export const ResourceMethods = ['update', 'show', 'delete'] as ResourcesMethodType[]

export interface ResourcesOptions {
  only?: ResourcesMethodType[]
  except?: ResourcesMethodType[]
}

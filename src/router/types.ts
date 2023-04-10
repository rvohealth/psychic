export type ResourceMethodType = 'index' | 'create' | 'update' | 'show' | 'delete'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export const ResourceMethods = ['index', 'create', 'update', 'show', 'delete'] as ResourceMethodType[]

export interface ResourcesOptions {
  only?: ResourceMethodType[]
  except?: ResourceMethodType[]
}

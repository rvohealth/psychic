import { pascalize } from '@rvohealth/dream'
import pluralize from 'pluralize'
import updirs from '../helpers/updirs'

export default async function generateClientAPIModule(modelName: string) {
  const pluralizedName = pluralize(modelName)
  const pascalizedName = pascalize(pluralizedName) + 'API'
  const pathifiedName = pluralizedName.replace(/\//g, '.')

  return `\
import { apiCall } from '${updirs(modelName.split('/').length - 1)}common'
import { User } from '${updirs(modelName.split('/').length - 1)}schema'

export default class ${pascalizedName} {
  public static index() {
    return apiCall('${pathifiedName.toLocaleLowerCase()}.index').send()
  }

  public static show(id: string) {
    return apiCall('${pathifiedName.toLocaleLowerCase()}.show', [id]).send()
  }

  public static create(body: Partial<User>) {
    return apiCall('${pathifiedName.toLocaleLowerCase()}.create').send({ body })
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('${pathifiedName.toLocaleLowerCase()}.update', [id]).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('${pathifiedName.toLocaleLowerCase()}.destroy', [id]).send()
  }
}`
}

import { pascalize } from '@rvohealth/dream'
import pluralize from 'pluralize'
import updirsFromPath from '../../helpers/path/updirsFromPath'

export default function generateClientAPIModule(route: string, modelName: string) {
  const pluralizedName = pluralize(modelName)
  const pascalizedName = pascalize(pluralizedName).replace(/\//g, '') + 'API'
  const dotRoute = route.replace(/^\//, '').replace(/\//g, '.')

  return `\
import { apiCall } from '${updirsFromPath(modelName)}common'
import { User } from '${updirsFromPath(modelName)}schema'

export default class ${pascalizedName} {
  public static index() {
    return apiCall('${dotRoute.toLocaleLowerCase()}.GET').send()
  }

  public static create(body: Partial<User>) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.POST').send({ body })
  }

  public static show(id: string) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.id.GET', { id }).send()
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.id.PATCH', { id }).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.id.DELETE', { id }).send()
  }
}`
}

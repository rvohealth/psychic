import { Dream, camelize, snakeify } from 'dream'
import { DateTime } from 'luxon'
export default class PsychicSerializer {
  private static _attributes: string[] = []

  public static attribute(...attrs: string[]) {
    return this.attributes(...attrs)
  }

  public static attributes(...attrs: string[]) {
    this._attributes = Array.from(new Set([...this._attributes, ...attrs]))
    return this
  }

  public _data: { [key: string]: any } | Dream | ({ [key: string]: any } | Dream)[]
  private _casing: 'snake' | 'camel' | null = null
  constructor(data: any) {
    this._data = data
  }

  public get data() {
    switch (this._casing) {
      case 'camel':
        return camelize(this._data)
      case 'snake':
        return snakeify(this._data)
      default:
        return this._data
    }
  }

  public get attributes() {
    const staticSelf: typeof PsychicSerializer = this.constructor as typeof PsychicSerializer
    const attributes = staticSelf._attributes

    switch (this._casing) {
      case 'camel':
        return attributes.map(attr => {
          const parts = attr.split(':')
          return camelize(parts[0]) + ':' + parts.slice(1, parts.length).join(':')
        })
      case 'snake':
        return attributes.map(attr => {
          const parts = attr.split(':')
          return [snakeify(parts[0]), ...parts.slice(1, parts.length)].join(':')
        })
      default:
        return attributes
    }
  }

  public casing(casing: 'snake' | 'camel') {
    this._casing = casing
    return this
  }

  public render(): { [key: string]: any } {
    if (Array.isArray(this.data)) return this.renderMany()
    else return this.renderOne()
  }

  public renderMany(): { [key: string]: any }[] {
    return (this.data as any[]).map(d => new (this.constructor as typeof PsychicSerializer)(d).render())
  }

  public renderOne() {
    const returnObj: { [key: string]: any } = {}
    this.attributes.forEach(attr => {
      const [attributeField, attributeType] = attr.split(':')
      switch (attributeType) {
        case 'date':
          const fieldValue: DateTime | undefined = (this.data as any)[attributeField]
          returnObj[attributeField] = fieldValue?.toFormat('yyyy-MM-dd')
          break

        default:
          returnObj[attributeField] = (this.data as any)[attributeField]
      }
    })
    return returnObj
  }
}

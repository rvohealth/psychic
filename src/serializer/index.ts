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

  public data: any
  constructor(data: any) {
    this.data = data
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
    const staticSelf: typeof PsychicSerializer = this.constructor as typeof PsychicSerializer
    staticSelf._attributes.forEach(attr => {
      const [attributeField, attributeType] = attr.split(':')
      switch (attributeType) {
        case 'date':
          const fieldValue: DateTime | undefined = this.data[attributeField]
          returnObj[attributeField] = fieldValue?.toFormat('yyyy-MM-dd')
          break

        default:
          returnObj[attributeField] = this.data[attributeField]
      }
    })
    return returnObj
  }
}

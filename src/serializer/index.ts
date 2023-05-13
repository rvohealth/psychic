import { Dream, camelize, snakeify } from 'dream'
import { DateTime } from 'luxon'
import { AttributeStatement } from './decorators/attribute'
export default class PsychicSerializer {
  public static attributeStatements: AttributeStatement[] = []
  private _data: { [key: string]: any } | Dream | ({ [key: string]: any } | Dream)[]
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
    const attributes = (this.constructor as typeof PsychicSerializer).attributeStatements.map(s => s.field)

    switch (this._casing) {
      case 'camel':
        return attributes.map(attr => camelize(attr))
      case 'snake':
        return attributes.map(attr => snakeify(attr))
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
      const attributeStatement = (this.constructor as typeof PsychicSerializer).attributeStatements.find(
        s =>
          [attr, this.applyCasingToField(attr)].includes(s.field) ||
          [attr, this.applyCasingToField(attr)].includes(this.applyCasingToField(s.field))
      )

      if (attributeStatement) {
        const { field, renderAs } = attributeStatement
        const fieldWithCasing = this.applyCasingToField(field)
        switch (renderAs) {
          case 'date':
            const fieldValue: DateTime | undefined = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = fieldValue?.toFormat('yyyy-MM-dd')
            break

          default:
            returnObj[fieldWithCasing] = this.getAttributeValue(attributeStatement)
        }
      }
    })
    return returnObj
  }

  private getAttributeValue(attributeStatement: AttributeStatement) {
    const { field, renderAs } = attributeStatement
    const fieldWithCasing = this.applyCasingToField(field)

    if (attributeStatement.functional) {
      return (this as any)[fieldWithCasing](this._data)
    } else {
      return (this.data as any)[fieldWithCasing]
    }
  }

  private applyCasingToField(field: string) {
    switch (this._casing) {
      case 'camel':
        return camelize(field)
      case 'snake':
        return snakeify(field)
      default:
        return field
    }
  }
}

export default class HowlSerializer {
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
    return (this.data as any[]).map(d => new (this.constructor as typeof HowlSerializer)(d).render())
  }

  public renderOne() {
    const returnObj: { [key: string]: any } = {}
    const staticSelf: typeof HowlSerializer = this.constructor as typeof HowlSerializer
    staticSelf._attributes.forEach(attr => {
      returnObj[attr] = this.data[attr]
    })
    return returnObj
  }
}

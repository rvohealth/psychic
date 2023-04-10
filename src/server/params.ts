export default class Params {
  public static restrict(params: { [key: string]: any }, allowed: string[]) {
    const permitted: { [key: string]: any } = {}
    if (!params) return permitted

    allowed.forEach(field => {
      permitted[field] = params[field]
    })
    return permitted
  }
}

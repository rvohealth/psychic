const IsDreamProvider = superclass => class extends superclass {
  static get isDream() {
    return true
  }

  static get isDreamInstance() {
    return false
  }

  static get isDreamClass() {
    return true
  }

  get isDream() {
    return true
  }

  get isDreamInstance() {
    return true
  }

  get isDreamClass() {
    return false
  }
}

export default IsDreamProvider


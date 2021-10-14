class Factory {
  static dreams = {}

  static boot(dreamsConfig) {
    this.dreams = dreamsConfig
  }

  static async create(dreamName, attrs) {
    console.log(dreamName, attrs, this.dreams)
  }
}

export default Factory

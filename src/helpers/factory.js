class InvalidDreamClass extends Error {}

class Factory {
  static dreams = {}

  static boot(dreamsConfig) {
    this.dreams = dreamsConfig
  }

  static async create(dreamName, attrs) {
    const dreamClass = this.dreams[dreamName]?.default
    if (!dreamClass) throw new InvalidDreamClass(dreamName)

    return await dreamClass.create(attrs)
  }

  static async build(dreamName, attrs) {
    const dreamClass = this.dreams[dreamName]?.default
    if (!dreamClass) throw new InvalidDreamClass(dreamName)

    return await dreamClass.new(attrs)
  }
}

export default Factory

class InvalidDreamClass extends Error {}

class Factory {
  static dreams = {}

  static boot(dreamsConfig) {
    this.dreams = dreamsConfig
  }

  static async create(dreamName, attrs) {
    const dreamClass = this.dreams[dreamName]
    if (!dreamClass) throw new InvalidDreamClass(dreamName)

    console.log(dreamClass, dreamName, this.dreams, this.dreams[dreamName])
    return await dreamClass.create(attrs)
  }
}

export default Factory

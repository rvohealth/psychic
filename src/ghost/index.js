import ghosts from 'src/ghost/ghosts'

class Ghost {
  #args = []

  constructor(...args) {
    this.#args = args
  }

  get hasModifier() {
    return ['get', 'set'].includes(this.#args.third)
  }

  get klass() {
    return this.#args.first
  }

  get methodName() {
    return this.#args.second
  }

  get modifier() {
    if (!this.hasModifier) return null
    return this.#args.third
  }

  get args() {
    if (this.hasModifier) return this.#args.fourth
    return this.#args.third
  }

  spawn() {
    if (this.hasModifier) throw 'need to add modifier logic for get, set'
    return ghosts.addStaticMethod(...this.#args)
  }
}

export default Ghost

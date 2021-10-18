import ghosts from 'src/ghost/ghosts'

const Ghostify = superclass => class extends superclass {
  static ghost(methodName, ...args) {
    ghosts.addDreamStaticMethod(this.name, methodName, ...args)
  }

  ghost(methodName, ...args) {
    ghosts.addDreamInstanceMethod(this.constructor.name, this.id, methodName, ...args)
  }
}

export default Ghostify



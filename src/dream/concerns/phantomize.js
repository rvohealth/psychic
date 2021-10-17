import phantomManager from 'src/phantom/manager'

const Phantomize = superclass => class extends superclass {
  static phantom(methodName, ...args) {
    phantomManager.addStaticDreamMethod(this.name, methodName, ...args)
  }

  phantom(methodName, ...args) {
    phantomManager.addInstanceDreamMethod(this.constructor.name, this.id, methodName, ...args)
  }
}

export default Phantomize



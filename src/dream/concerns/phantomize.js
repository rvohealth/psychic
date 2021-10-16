import phantomManager from 'src/phantom/manager'

const Phantomize = superclass => class extends superclass {
  static phantom(methodName, ...args) {
    phantomManager.addDreamStaticMethod(this.name, methodName, ...args)
  }
}

export default Phantomize



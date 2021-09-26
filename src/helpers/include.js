import staticMethods from 'src/helpers/staticMethods'
import instanceMethods from 'src/helpers/instanceMethods'
import getters from 'src/helpers/getters'
import setters from 'src/helpers/setters'

export default function include(klass, ...mixins) {
  mixins.forEach(mixin => {
    staticMethods(mixin).forEach(method => {
      Object.assign(klass, { [method.name]: mixin[method.name] })
    })

    instanceMethods(mixin).forEach(method => {
      Object.assign(klass.prototype, { [method.name]: mixin.prototype[method.name] })
    })

    getters(mixin).forEach(getter => {
      const descriptor = Object.getOwnPropertyDescriptor(mixin, getter)
      Object.defineProperty(klass, getter, descriptor)
    })

    getters(mixin.prototype).forEach(getter => {
      const descriptor = Object.getOwnPropertyDescriptor(mixin.prototype, getter)
      Object.defineProperty(klass.prototype, getter, descriptor)
    })

    setters(mixin).forEach(setter => {
      const descriptor = Object.setOwnPropertyDescriptor(mixin, setter)
      Object.defineProperty(klass, setter, descriptor)
    })

    setters(mixin.prototype).forEach(setter => {
      const descriptor = Object.setOwnPropertyDescriptor(mixin.prototype, setter)
      Object.defineProperty(klass.prototype, setter, descriptor)
    })
  })

  return klass
}

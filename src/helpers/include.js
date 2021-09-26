import staticMethods from 'src/helpers/staticMethods'
import instanceMethods from 'src/helpers/instanceMethods'
import getters from 'src/helpers/getters'
import setters from 'src/helpers/setters'

// Note: As of now, this works somewhat well, but will fail to maintain imports
// from separate classes. to get around this, those thiings imported will need
// to be coupled to the instance, which no fun for anyone. for now,
// I am deprecating this approach in favor of the mix helper.
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
      descriptor.get = descriptor.get.bind(klass)
      Object.defineProperty(klass, getter, descriptor)
    })

    getters(mixin.prototype).forEach(getter => {
      const descriptor = Object.getOwnPropertyDescriptor(mixin.prototype, getter)
      descriptor.get = descriptor.get.bind(klass.prototype)
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

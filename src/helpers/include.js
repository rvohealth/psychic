import staticMethods from 'src/helpers/staticMethods'
import instanceMethods from 'src/helpers/instanceMethods'

export default function include(klass, ...mixins) {
  mixins.forEach(mixin => {
    staticMethods(mixin).forEach(method => {
      Object.assign(klass, { [method.name]: mixin[method.name] })
    })

    instanceMethods(mixin).forEach(method => {
      Object.assign(klass.prototype, { [method.name]: mixin.prototype[method.name] })
    })
  })
}

export default function getters(klass) {
  return Object.getOwnPropertyNames(klass)
    .map(key => [key, Object.getOwnPropertyDescriptor(klass, key)])
    .filter(([, descriptor]) => typeof descriptor.get === 'function')
    .map(([key]) => key)
}


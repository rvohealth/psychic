export default function setters(klass) {
  return Object.getOwnPropertyNames(klass)
    .map(key => [key, Object.getOwnPropertyDescriptor(klass, key)])
    .filter(([, descriptor]) => typeof descriptor.set === 'function')
    .map(([key]) => key)
}


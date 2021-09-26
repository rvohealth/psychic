export default function instanceMethods(obj) {
  const descriptors = Object.getOwnPropertyDescriptors(obj.prototype)
  return Object
    .keys(descriptors)
    .filter(key => !descriptors[key].get && !descriptors[key].set)
    .map(key => obj.prototype[key])
}

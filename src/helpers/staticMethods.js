// https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class/31055217

export default function staticMethods(obj) {
  return Object
    .getOwnPropertyNames(obj)
    .filter(prop => typeof obj[prop] === 'function')
    .map(methodName => obj[methodName])
}

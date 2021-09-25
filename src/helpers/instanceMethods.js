// https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class/31055217

export default function instanceMethods(obj) {
  try {
    return Object
      .getOwnPropertyNames(obj.prototype)
      .map(methodName => obj.prototype[methodName])
  } catch(error) {
    // console.log(error)
    return []
  }
}

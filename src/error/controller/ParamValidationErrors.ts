export default class ParamValidationErrors extends Error {
  // in this case, $data is an object already containing the shape:
  // {
  //   name: ['too short', ...]
  // }
  constructor(public errors: object) {
    super()
  }
}

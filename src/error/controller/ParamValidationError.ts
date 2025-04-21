export default class ParamValidationError extends Error {
  constructor(
    public paramName: string,
    public errorMessages: string[],
  ) {
    super()
  }
}

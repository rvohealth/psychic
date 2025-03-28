export default class UnexpectedUndefined extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `Undefined detected where it should never happen since we are iterating 
over keys of an internal object that should not have undefined values.

This was added as part of activating noUncheckedIndexedAccess in tsconfig.`
  }
}

export default class MustCallPsychicAppInitFirst extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
      For some reason, PsychicApp.init was never called. In order for the
      execution context to proceed, you must first ensure that PsychicApp.init
      has been called. Usually, this is done by calling

        await initializePsychicApp()

      which is set up in your application boilerplate for you by default for
      the relevant execution contexts. Perhaps it was mistakenly removed, or
      otherwise you are trying to implement a new entrypoint into psychic, at
      which case, please make sure to call 'await initializePsychicApp()' first
    `
  }
}

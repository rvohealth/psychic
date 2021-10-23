// https://stackoverflow.com/questions/50121134/how-do-i-fail-a-test-in-jest-when-an-uncaught-promise-rejection-occurs
// this helps point to underlying failure in code
if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
  process.on('unhandledRejection', reason => {
    throw reason
  })
  // Avoid memory leak by adding too many listeners
  process.env.LISTENING_TO_UNHANDLED_REJECTION = true
}


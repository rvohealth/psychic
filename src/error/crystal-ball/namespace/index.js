export default class NamespaceError extends Error {
  constructor(message) {
    super(
`
An Error occured while attempting to parse your routing file (located in config/routes.js).
The error given was:

${message}
`
    )
  }
}

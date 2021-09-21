import NamespaceError from 'src/error/crystal-ball/namespace'

export default class InvalidGivenType extends NamespaceError {
  constructor(givenType, givenKey) {
    const givenString = `${givenType}:${givenKey}`
    super(
`
The given type ${givenType} provided by call in config/routes.js to '${givenString}' is invalid.
try running:

r.given('auth:${givenKey}')
`
    )
  }
}




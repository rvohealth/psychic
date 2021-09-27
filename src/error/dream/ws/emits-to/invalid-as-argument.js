export default class InvalidAsArgumentError extends Error {
  constructor() {
    super(
`
the argument 'as' is required, and must be a string pointing to the name
of an authenticated dream instance.

e.g.

initialize() {
  this
    .belongsTo('user')
    .emitsTo('user', { as: 'currentUser' })
}
`
    )
  }
}



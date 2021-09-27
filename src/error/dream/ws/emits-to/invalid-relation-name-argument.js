export default class InvalidRelationNameArgumentError extends Error {
  constructor() {
    super(
`
the argument 'relationName' is required, and must be a string pointing to the name
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



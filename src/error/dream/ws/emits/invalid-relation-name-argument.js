export default class InvalidRelationNameArgumentError extends Error {
  constructor() {
    super(
`
the argument 'relationName' is required, and must be a string pointing to the name
of an authenticated dream instance.

e.g.

static {
  this
    .belongsTo('user')
    .emitsTo('user', { as: 'currentUser' })
}


dream.emit('user', 'some/path', { message: 123 })
`
    )
  }
}



export default class InvalidThroughError extends Error {
  constructor() {
    super(
`
the argument 'through' must already be a valid association against an instance.

e.g.

initialize() {
  this
    .hasOne('person')
    .hasOne('thing', through: 'person')
}
`
    )
  }
}


export default class CannotFindInverseStatement extends Error {
  constructor(methodName) {
    super(
`
Cannot find an inverse statement for ${methodName}.
Ordinary methods like createTable are easy to reverse, but other methods
make less sense for this sort of behavior. In these cases, we recommend
you explicitly define a 'down' method in your migration, so as to explicitly
define the best way to revert this migration.
`
    )
  }
}

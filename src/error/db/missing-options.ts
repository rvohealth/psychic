import DBError from './index'

export default class DBMissingOptions extends DBError {
  constructor(error: Error) {
    super(
      `
Failed to locate the database options required to bootstrap your psychic app.
Please make sure the following file is present in your app:

  conf/db.ts

the underlying error that triggered this message was:
  ${error}
`
    )
  }
}

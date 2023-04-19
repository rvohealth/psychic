import DBError from './index'

export default class DBFailedToConnect extends DBError {
  constructor(error: Error) {
    super(
      `
Failed to connect to the database using the credentials located at:

  conf/db.ts

Please check that your credentials are valid, and then try again.
The underlying error that triggered this message was:
  ${error}
`
    )
  }
}

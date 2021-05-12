import PostgresAdapter from 'src/db/adapter/postgres'

export default class DBOperations {
  get adapter() {
    // eventually we will have options here.
    return new PostgresAdapter()
  }
}

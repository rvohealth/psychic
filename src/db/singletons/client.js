import pg from 'pg'
import config from 'src/singletons/config'
const { Client } = pg
global.__psychic_pg_client = global.__psychic_pg_client || new Client({
  database: config.dbName,
  // user: 'dbuser',
  // host: 'database.server.com',
  // password: 'secretpassword',
  // port: 3211,
})
export default global.__psychic_pg_client

import pg from 'pg'
const { Client } = pg

global.__psychic_pg_root_client = global.__psychic_pg_root_client || new Client()
export default global.__psychic_pg_root_client

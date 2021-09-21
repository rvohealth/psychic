import DB from 'src/db'

const db = global.__psychic__db || new DB()
global.__psychic__db = db

export default db


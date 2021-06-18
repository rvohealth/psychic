import Spawn from 'src/spawn'

const spawn = global.__psychic__spawn || new Spawn()
global.__psychic__spawn = spawn

export default spawn


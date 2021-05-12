import L from 'src/l'

const l = global.__psychic__l || new L()
global.__psychic__l = l

export default l

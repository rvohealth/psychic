import Psychic from 'src/psychic'

const psychic = global.__psychic || new Psychic()
global.__psychic = psychic

export default psychic

import ESP from 'src/esp'

const esp = global.__psychic__esp || new ESP()
global.__psychic__esp = esp

export default esp


import Config from 'src/config'

const config = global.__psychic__config || new Config()
global.__psychic__config = config

export default config


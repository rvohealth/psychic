import Transports from 'src/message/transports'

const transports = global.__psychic__transports || new Transports()
global.__psychic__transports = transports

export default transports


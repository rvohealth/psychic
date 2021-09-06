import TelekineticBridges from 'src/telekinesis/bridges'

const telekineticBridges = global.__psychic__telekinetic_bridges || new TelekineticBridges()
global.__psychic__telekinetic_bridges = telekineticBridges

export default telekineticBridges


import 'src/boot/all'
import psychic from 'src/singletons/psychic'
import Migrate from 'src/migrate'
import _Channel from 'src/channel'
import _CLI from 'src/cli'
import _Dream from 'src/dream'
import _Projection from 'src/projection'
import _config from 'src/config'

export const Channel = _Channel
export const CLI = _CLI
export const Dream = _Dream
export const Projection = _Projection
export const config = _config
export const migrate = new Migrate()

export default psychic

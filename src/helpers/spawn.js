import util from 'util'
import { spawn } from 'child_process'

const spawnp = util.promisify(spawn)

export default spawnp

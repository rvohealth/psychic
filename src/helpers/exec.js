import util from 'util'
import { exec } from 'child_process'

const execp = util.promisify(exec)

export default execp

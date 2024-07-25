import path from 'path'
import envValue, { envBool } from '../../helpers/envValue'

export default function psychicRootPath({ filepath }: { filepath?: string } = {}): string {
  if (!envValue('APP_ROOT_PATH'))
    throw `
    ATTENTION!: Must set APP_ROOT_PATH env var to your project root
  `

  if (envBool('PSYCHIC_CORE_DEVELOPMENT')) {
    return path.join(envValue('APP_ROOT_PATH'), '..', filepath || '')
  } else {
    return path.join(envValue('APP_ROOT_PATH'), 'node_modules/psychic', filepath || '')
  }
}

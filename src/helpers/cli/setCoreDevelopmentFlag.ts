import { envBool } from '../envValue'

export default function setCoreDevelopmentFlag(programArgs: string[]) {
  if (envBool('PSYCHIC_CORE_DEVELOPMENT') || programArgs.includes('--core')) {
    process.env.PSYCHIC_CORE_DEVELOPMENT = '1'
    return 'PSYCHIC_CORE_DEVELOPMENT=1 '
  } else {
    return ''
  }
}

export function coreSuffix(programArgs: string[]) {
  return programArgs.includes('--core') ? ' --core' : ''
}

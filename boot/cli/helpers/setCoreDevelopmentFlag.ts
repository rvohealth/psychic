export default function setCoreDevelopmentFlag(programArgs: string[]) {
  if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1' || programArgs.includes('--core')) {
    process.env.PSYCHIC_CORE_DEVELOPMENT = '1'
    return 'PSYCHIC_CORE_DEVELOPMENT=1 '
  } else {
    return ''
  }
}

export function coreSuffix(programArgs: string[]) {
  return programArgs.includes('--core') ? ' --core' : ''
}

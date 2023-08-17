import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'

export type TypescriptFileType = `${string}.ts`
export default function dreamjsOrDreamtsCmd(
  cmd: string,
  programArgs: string[],
  { cmdArgs = [] }: { cmdArgs?: string[] } = {}
) {
  const coreDevFlag = setCoreDevelopmentFlag(programArgs)
  const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1'
  const dreamCmd = useTsnode ? 'dreamts' : 'dreamjs'
  const omitDistFromPathEnv = useTsnode ? 'PSYCHIC_OMIT_DIST_FOLDER=1 ' : ''
  const basepath = process.env.PSYCHIC_CORE_DEVELOPMENT === '1' ? '' : '../../'
  if (useTsnode) cmdArgs.push('--tsnode')

  const fullcmd = `${coreDevFlag}${omitDistFromPathEnv}yarn --cwd=${basepath}node_modules/dream ${dreamCmd} ${cmd} ${cmdArgs.join(
    ' '
  )} `

  return fullcmd
}

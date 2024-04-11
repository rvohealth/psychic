import path from 'path'
import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'
import omitCoreArg from './omitCoreArg'

export type TypescriptFileType = `${string}.ts`
export default function nodeOrTsnodeCmd(
  filePath: TypescriptFileType,
  programArgs: string[],
  {
    nodeFlags = [],
    tsnodeFlags = [],
    fileArgs = [],
  }: { nodeFlags?: string[]; tsnodeFlags?: string[]; fileArgs?: string[] } = {},
) {
  const coreDevFlag = setCoreDevelopmentFlag(programArgs)
  const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1'
  const nodeCmd = useTsnode ? 'npx ts-node' : 'node'
  const omitDistFromPathEnv = useTsnode ? 'PSYCHIC_OMIT_DIST_FOLDER=1 ' : ''
  const realFilePath = useTsnode ? filePath : path.join('dist', filePath.replace(/\.ts$/, '.js'))
  if (useTsnode) fileArgs.push('--tsnode')
  return `${coreDevFlag}${omitDistFromPathEnv}${nodeCmd} ${(useTsnode ? tsnodeFlags : nodeFlags).join(
    ' ',
  )} ${realFilePath} ${fileArgs.join(' ')} ${omitCoreArg(programArgs).join(' ')}`
}

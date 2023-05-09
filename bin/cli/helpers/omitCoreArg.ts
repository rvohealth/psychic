export default function omitCoreArg(programArgs: string[]) {
  return programArgs.filter(arg => arg !== '--core')
}

export default function omitCoreArg(programArgs: string[]): string[] {
  return programArgs.filter(arg => arg !== '--core')
}

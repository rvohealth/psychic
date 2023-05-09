export default function yarnCwd(programArgs: string[]) {
  return programArgs.includes('--core') ? '' : ' --cwd=../../ '
}

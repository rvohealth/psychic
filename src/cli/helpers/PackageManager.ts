import PsychicApp from '../../psychic-app/index.js'

export interface PackageManagerCommand {
  command: string
  args: string[]
}

export default class PackageManager {
  public static get packageManager() {
    return PsychicApp.getOrFail().packageManager
  }

  public static add(
    dependencyOrDependencies: string | string[],
    { dev }: { dev?: boolean } = {},
  ): PackageManagerCommand {
    const list = Array.isArray(dependencyOrDependencies)
      ? dependencyOrDependencies
      : [dependencyOrDependencies]

    if (dev) {
      switch (this.packageManager) {
        case 'npm':
          return { command: 'npm', args: ['install', '--save-dev', ...list] }
        default:
          return { command: this.packageManager, args: ['add', '-D', ...list] }
      }
    } else {
      switch (this.packageManager) {
        case 'npm':
          return { command: 'npm', args: ['install', ...list] }
        default:
          return { command: this.packageManager, args: ['add', ...list] }
      }
    }
  }

  public static run(cmd: string, args: string[] = []): PackageManagerCommand {
    switch (this.packageManager) {
      case 'npm':
        // npm requires `--` to separate npm args from script args
        return {
          command: 'npm',
          args: args.length ? ['run', cmd, '--', ...args] : ['run', cmd],
        }
      default:
        return { command: this.packageManager, args: [cmd, ...args] }
    }
  }

  public static exec(cmd: string, args: string[] = []): PackageManagerCommand {
    switch (this.packageManager) {
      case 'npm':
        return { command: 'npm', args: ['exec', '--', cmd, ...args] }
      case 'yarn':
        return { command: 'yarn', args: [cmd, ...args] }
      default:
        return { command: this.packageManager, args: ['exec', cmd, ...args] }
    }
  }
}

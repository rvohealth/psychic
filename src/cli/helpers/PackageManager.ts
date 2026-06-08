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
        case 'bun':
          return { command: 'bun', args: ['add', '--dev', ...list] }
        case 'deno':
          // Deno needs an explicit registry prefix to add npm packages.
          return { command: 'deno', args: ['add', '--dev', ...denoSpecifiers(list)] }
        default:
          return { command: this.packageManager, args: ['add', '-D', ...list] }
      }
    } else {
      switch (this.packageManager) {
        case 'npm':
          return { command: 'npm', args: ['install', ...list] }
        case 'bun':
          return { command: 'bun', args: ['add', ...list] }
        case 'deno':
          return { command: 'deno', args: ['add', ...denoSpecifiers(list)] }
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
      case 'bun':
        // `bun <script>` is treated as file execution; `bun run` is required to
        // resolve a package.json script. Bun forwards trailing args directly.
        return { command: 'bun', args: ['run', cmd, ...args] }
      case 'deno':
        // Deno has no `<pm> <script>` shorthand; `deno task` resolves a
        // package.json script (or deno.json task) and forwards trailing args.
        return { command: 'deno', args: ['task', cmd, ...args] }
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
      case 'bun':
        return { command: 'bunx', args: [cmd, ...args] }
      case 'deno':
        // `deno run` against an npm: specifier is Deno's equivalent of npx;
        // -A grants the permissions the executed tool needs.
        return { command: 'deno', args: ['run', '-A', denoSpecifier(cmd), ...args] }
      default:
        return { command: this.packageManager, args: ['exec', cmd, ...args] }
    }
  }
}

// Deno requires npm/jsr packages to carry an explicit registry prefix
// (`npm:lodash`); bare names are treated as local/JSR specifiers. Leave any
// already-prefixed specifier untouched.
function denoSpecifier(pkg: string): string {
  return /^(npm|jsr):/.test(pkg) ? pkg : `npm:${pkg}`
}

function denoSpecifiers(list: string[]): string[] {
  return list.map(denoSpecifier)
}

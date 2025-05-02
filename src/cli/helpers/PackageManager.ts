import PsychicApp from '../../psychic-app/index.js'

export default class PackageManager {
  public static get packageManager() {
    return PsychicApp.getOrFail().packageManager
  }

  public static add(dependencyOrDependencies: string | string[], { dev }: { dev?: boolean } = {}) {
    const dependency = Array.isArray(dependencyOrDependencies)
      ? dependencyOrDependencies.join(' ')
      : dependencyOrDependencies

    if (dev) {
      switch (this.packageManager) {
        case 'npm':
          return `${this.packageManager} install --save-dev ${dependency}`
        default:
          return `${this.packageManager} add -D ${dependency}`
      }
    } else {
      switch (this.packageManager) {
        case 'npm':
          return `${this.packageManager} install ${dependency}`

        default:
          return `${this.packageManager} add ${dependency}`
      }
    }
  }

  public static run(cmd: string) {
    switch (this.packageManager) {
      case 'npm':
        return `npm run ${cmd}`

      default:
        return `${this.packageManager} ${cmd}`
    }
  }
}

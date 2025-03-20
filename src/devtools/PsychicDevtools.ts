import {
  launchDevServer,
  LaunchDevServerOpts,
  stopDevServer,
  stopDevServers,
} from './helpers/launchDevServer.js'

export default class PsychicDevtools {
  public static async launchDevServer(key: string, opts?: LaunchDevServerOpts) {
    return await launchDevServer(key, opts)
  }

  public static stopDevServer(key: string) {
    return stopDevServer(key)
  }

  public static stopDevServers() {
    return stopDevServers()
  }
}

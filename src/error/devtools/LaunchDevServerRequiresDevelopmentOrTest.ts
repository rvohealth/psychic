export default class LaunchDevServerRequiresDevelopmentOrTest extends Error {
  private cmd: string
  constructor(cmd: string) {
    super()
    this.cmd = cmd
  }

  public override get message() {
    return `
launchDevServer refused to run outside development or test
(NODE_ENV must be 'development' or 'test').

This helper exists to spawn a local dev server during development
and tests. A deployed process has no business shelling out to boot
another server, so refusing here turns the dev-only contract into a
runtime invariant. Checking \`!isDevelopmentOrTest\` (rather than
\`isProduction\`) means staging-style envs and any unforeseen
NODE_ENV value also fail closed.

  cmd: ${this.cmd}
    `
  }
}

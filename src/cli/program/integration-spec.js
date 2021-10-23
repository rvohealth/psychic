import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
export default class IntegrationSpecCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.intspec(args.args)
    throw `unhandled command ${args.command}`
  }

  async intspec(args) {
    if (args?.length)
      await spawn(
        `npm run integration-spec-untargeted ${args.join(' ')} --forceExit`,
        [],
        {
          shell: true,
          stdio: 'inherit',
          env: {
            ...process.env,
            JEST_PUPPETEER_CONFIG: process.env.DRIVER ?
              `.jest-puppeteer.${process.env.DRIVER}.config.js` :
              '.jest-puppeteer.config.js',
          },
        }
      )
    else
      await spawn(
        `npm run integration-spec --forceExit`,
        [],
        {
          shell: true,
          stdio: 'inherit',
          env: {
            ...process.env,
            JEST_PUPPETEER_CONFIG: process.env.DRIVER ?
              `.jest-puppeteer.${process.env.DRIVER}.config.js` :
              '.jest-puppeteer.config.js',
          },
        }
      )
  }
}

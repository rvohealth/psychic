import { PsychicApp } from '../../../../src/index.js'

export default (psy: PsychicApp) => {
  psy.on('cli:start', program => {
    program
      .command('cli-start-hooks:test')
      .description('tests that our custom cli hooks work')
      .action(() => {
        console.log('cli:start hooks fired')
        process.exit()
      })
  })
}

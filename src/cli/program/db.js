import Migrate from 'src/migrate'
import CLIProgram from 'src/cli/program'
import db from 'src/db'
import config from 'src/config'
import l from 'src/singletons/l'

export default class DBCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === 'create') return await this.create()
    if (args.command === 'drop') return await this.drop()
    if (args.command === 'migrate') return await this.migrate()
    if (args.command === 'seed') return await this.seed()
    throw `unhandled command ${args.command}`
  }

  async create() {
    try {
      await db.create()
    } catch(_) {
      console.error("CATCHING DB CREATE ERROR:", _)
      // ignoring error intentionally here, need a createIfNotExists
    }

    await db.createMigrationsIfNotExists()

    if (!process.env.CORE_TEST)
      process.exit()
  }

  async drop() {
    try {
      await db.drop()
    } catch(_) {
      l.log(_)
      // ignoring error intentionally here, need a dropIfExists
    }

    if (!process.env.CORE_TEST)
      process.exit()
  }

  async migrate() {
    await Migrate.run()

    if (!process.env.CORE_TEST)
      process.exit()
  }

  async rollback() {
    await Migrate.rollback()

    if (!process.env.CORE_TEST)
      process.exit()
  }

  async seed() {
    await config.dbSeedCB()

    if (!process.env.CORE_TEST)
      process.exit()
  }
}

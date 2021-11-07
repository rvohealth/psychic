import psychic, { CLI } from 'psychic'

async function runCLI() {
  await psychic.boot()

  const cli = new CLI()
  await cli.run()
}

runCLI()

import psychic, { CLI } from 'psychic'
import packagedDreams from 'app/pkg/dreams.pkg'
import packagedChannels from 'app/pkg/channels.pkg'
import packagedProjections from 'app/pkg/projections.pkg'
import routesCB from 'config/routes'

async function runCLI() {
  psychic.boot(packagedDreams, packagedChannels, packagedProjections, routesCB)

  const cli = new CLI()
  await cli.run()
}

runCLI()

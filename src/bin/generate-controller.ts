import generateController from '../generate/controller'

async function _generateController() {
  const route = process.argv[2]
  const name = process.argv[3]
  const indexOfTsNode = process.argv.findIndex(str => str === '--tsnode')
  const methods = indexOfTsNode ? process.argv.slice(4, indexOfTsNode) : process.argv.slice(4)
  await generateController(
    route,
    name,
    methods.filter(method => !['--core'].includes(method))
  )
}

void _generateController()

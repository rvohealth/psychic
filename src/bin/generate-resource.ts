import generateResource from '../generate/resource'

async function _generateResource() {
  const route = process.argv[2]
  const name = process.argv[3]
  const indexOfTsNode = process.argv.findIndex(str => str === '--tsnode')
  const args = indexOfTsNode ? process.argv.slice(4, indexOfTsNode) : process.argv.slice(4)
  await generateResource(route, name, args)
}

void _generateResource()

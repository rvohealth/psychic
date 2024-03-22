import generateResource from '../generate/resource'

async function _generateResource() {
  console.log(process.argv)
  let route = process.argv[2]
  let name = process.argv[3]
  const args = process.argv.slice(4, process.argv.length)
  await generateResource(route, name, args)
}
_generateResource()

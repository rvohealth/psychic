import generateResource from '../generate/resource'

async function _generateResource() {
  let route = process.argv[2]
  let name = process.argv[3]
  // omit the last arg, since it is for some reason a clustering of all args put together,
  // and will inevitably confuse the helper function into generating nonsensical model attributes
  const args = process.argv.slice(4, process.argv.length - 1)
  await generateResource(route, name, args)
}
_generateResource()

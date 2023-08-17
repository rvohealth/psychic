import generateController from '../generate/controller'

async function _generateController() {
  let route = process.argv[2]
  let name = process.argv[3]
  const methods = process.argv.slice(4, process.argv.length)
  await generateController(
    route,
    null,
    methods.filter(method => !['--core'].includes(method))
  )
}
_generateController()

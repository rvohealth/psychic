import generateController from '../generate/controller'

async function _generateController() {
  const route = process.argv[2]
  const name = process.argv[3]
  const methods = process.argv.slice(4, process.argv.length)
  await generateController(
    route,
    name,
    methods.filter(method => !['--core'].includes(method)),
  )
}

void _generateController()

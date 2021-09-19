import NamespaceError from 'src/error/crystal-ball/namespace'

export default class UnrecognizedRoute extends NamespaceError {
  constructor(route, expectedChannel, expectedMethod) {
    super(
`
The route '${route}' is missing its matching channel. In order to set this up properly,
try running:

psy g:channel ${expectedChannel}

once done, be sure to define the following method:

  ${expectedChannel}#${expectedMethod}
`
    )
  }
}



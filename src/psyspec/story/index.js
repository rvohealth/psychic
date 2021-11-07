// NOTE: This file not imported by the core psychic engine. It is instead imported
// by the user directly using
//
// import 'psychic/psyspec/stories'
//
// it will provide a feature spec framework which is custom-tailored to a real psychic app.

import 'src/psychic/boot/globals/spec'
import 'src/psychic/boot/globals/story'
import _Factory from 'src/helpers/factory'
import {
  launchServers as _launchServers,
  killServers as _killServers,
} from 'src/psyspec/story/helpers/launch-servers'

export const Factory = _Factory
export const killServers = _killServers
export const launchServers = _launchServers

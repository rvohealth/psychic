// NOTE: This file not imported by the core psychic engine. It is instead imported
// by the user directly using
//
// import 'psychic/psyspec'
//
// or else by using
//
// import { Factory } from 'psychic/psyspec'
//
// either way, it will provide a spec framework which is custom-tailored to a real psychic app.

import 'src/psychic/boot/globals/core-spec'
import 'src/psychic/boot/globals/spec'
import _Factory from 'src/helpers/factory'

export const Factory = _Factory

import 'src/boot/all'
import fileExists from 'src/helpers/file-exists'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

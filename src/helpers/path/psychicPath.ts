import dreamPath from '@rvohealth/dream/src/helpers/path/dreamPath'
import { getCachedPsychicApplicationOrFail } from '../../psychic-application/cache'

export default function (dreamPathType: PsychicPaths) {
  const psychicApp = getCachedPsychicApplicationOrFail()

  switch (dreamPathType) {
    case 'controllers':
      return psychicApp.paths.controllers

    case 'controllerSpecs':
      return psychicApp.paths.controllerSpecs

    default:
      return dreamPath(dreamPathType)
  }
}

type DreamPaths = 'models' | 'modelSpecs' | 'serializers' | 'db' | 'conf' | 'factories'
export type PsychicPaths = DreamPaths | 'controllers' | 'controllerSpecs'

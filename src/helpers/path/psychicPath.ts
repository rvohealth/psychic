import { dreamPath } from '@rvohealth/dream'
import PsychicApplication from '../../psychic-application/index.js'

export default function (dreamPathType: PsychicPaths) {
  const psychicApp = PsychicApplication.getOrFail()

  switch (dreamPathType) {
    case 'apiRoutes':
      return psychicApp.paths.apiRoutes

    case 'controllers':
      return psychicApp.paths.controllers

    case 'controllerSpecs':
      return psychicApp.paths.controllerSpecs

    default:
      return dreamPath(dreamPathType)
  }
}

type DreamPaths = 'models' | 'modelSpecs' | 'serializers' | 'db' | 'conf' | 'factories'
export type PsychicPaths = DreamPaths | 'apiRoutes' | 'controllers' | 'controllerSpecs'

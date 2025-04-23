import { dreamPath } from '@rvoh/dream'
import PsychicApp from '../../psychic-app/index.js'

export default function (dreamPathType: PsychicPaths) {
  const psychicApp = PsychicApp.getOrFail()

  switch (dreamPathType) {
    case 'apiRoutes':
      return psychicApp.paths.apiRoutes

    case 'controllers':
      return psychicApp.paths.controllers

    case 'controllerSpecs':
      return psychicApp.paths.controllerSpecs

    case 'services':
      return psychicApp.paths.services

    default:
      return dreamPath(dreamPathType)
  }
}

type DreamPaths = 'models' | 'modelSpecs' | 'serializers' | 'db' | 'conf' | 'factories'
export type PsychicPaths = DreamPaths | 'apiRoutes' | 'controllers' | 'controllerSpecs' | 'services'

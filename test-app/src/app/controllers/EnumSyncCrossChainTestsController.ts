import { PsychicOpenapiNames } from '../../../../src/controller/index.js'
import { OpenAPI } from '../../../../src/package-exports/index.js'
import Pet from '../models/Pet.js'
import {
  BalloonColorBlueSubsetSerializer,
  BalloonColorGreenSubsetSerializer,
  PetSpeciesSubsetSerializer,
} from '../serializers/EnumSyncTestSerializer.js'
import ApplicationController from './ApplicationController.js'

/**
 * Fixture endpoints for the OpenAPI-derived enum sync unit specs, scoped to
 * the `enumTest` spec.
 *
 * - balloon_colors_enum appears at two serializer sites with different subset
 *   overrides (`['blue']` and `['green']`): the export must be the union of
 *   both subsets, with the never-rendered `'red'` excluded
 * - species_types_enum appears via a subset override AND via a model-derived
 *   request body (which has no override channel and always renders the full
 *   pg value set): the export must be the full set
 */
export default class EnumSyncCrossChainTestsController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<EnumSyncCrossChainTestsController> {
    return ['enumTest']
  }

  @OpenAPI(BalloonColorBlueSubsetSerializer, {
    status: 200,
  })
  public colorBlueSubset() {
    this.ok()
  }

  @OpenAPI(BalloonColorGreenSubsetSerializer, {
    status: 200,
  })
  public colorGreenSubset() {
    this.ok()
  }

  @OpenAPI(PetSpeciesSubsetSerializer, {
    status: 200,
    requestBody: {
      for: Pet,
      params: ['species'],
    },
  })
  public speciesOverrideAndRequestBody() {
    this.ok()
  }
}

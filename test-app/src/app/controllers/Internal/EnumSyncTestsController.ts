import { OpenAPI } from '../../../../../src/package-exports/index.js'
import Balloon from '../../models/Balloon.js'
import Pet from '../../models/Pet.js'
import User from '../../models/User.js'
import { PetSpeciesSubsetSerializer } from '../../serializers/EnumSyncTestSerializer.js'
import InternalAuthedController from './AuthedController.js'

/**
 * Fixture endpoints for the OpenAPI-derived enum sync unit specs.
 *
 * Each pg enum reaches the `internal` spec through exactly one kind of site,
 * so the enum sync specs can prove per-site collection behavior:
 * - species_types_enum: ONLY a serializer subset override (`enum: ['cat']`)
 * - pet_treats_enum: ONLY a model-derived request body
 * - balloon_colors_enum: ONLY a nested `for:` sentinel inside `combining`
 */
export default class InternalEnumSyncTestsController extends InternalAuthedController {
  @OpenAPI(PetSpeciesSubsetSerializer, {
    status: 200,
  })
  public speciesSubset() {
    this.ok()
  }

  @OpenAPI({
    status: 204,
    requestBody: {
      for: Pet,
      params: ['favoriteTreat'],
    },
  })
  public treatRequestBody() {
    this.noContent()
  }

  @OpenAPI({
    status: 204,
    requestBody: {
      for: User,
      combining: {
        balloon: {
          for: Balloon,
          params: ['color'],
        },
      },
    },
  })
  public nestedForCombining() {
    this.noContent()
  }
}

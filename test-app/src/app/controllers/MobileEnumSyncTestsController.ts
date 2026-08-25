import { PsychicOpenapiNames } from '../../../../src/controller/index.js'
import { OpenAPI } from '../../../../src/package-exports/index.js'
import Pet from '../models/Pet.js'
import {
  BalloonColorResponseSerializer,
  HandWrittenEnumSerializer,
  PetTreatsItemsSubsetSerializer,
} from '../serializers/EnumSyncTestSerializer.js'
import ApplicationController from './ApplicationController.js'

/**
 * Fixture endpoints for the OpenAPI-derived enum sync unit specs, scoped to
 * the `mobile` spec (which sets `suppressResponseEnums: true`).
 *
 * Each pg enum reaches the `mobile` spec through exactly one kind of site:
 * - balloon_colors_enum: ONLY a response serializer (proves suppressed specs
 *   still collect real values)
 * - pet_treats_enum: ONLY an items-level subset override on an array column
 * - species_types_enum: ONLY a request-body site shadowed by a same-key
 *   `combining` entry (must contribute nothing)
 * - the hand-written `mood` enum has no pg type name (must never be exported)
 */
export default class MobileEnumSyncTestsController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<MobileEnumSyncTestsController> {
    return ['mobile']
  }

  @OpenAPI(BalloonColorResponseSerializer, {
    status: 200,
  })
  public balloonColorResponse() {
    this.ok()
  }

  @OpenAPI(PetTreatsItemsSubsetSerializer, {
    status: 200,
  })
  public treatsItemsSubset() {
    this.ok()
  }

  @OpenAPI({
    status: 204,
    requestBody: {
      for: Pet,
      params: ['species'],
      combining: {
        species: { type: 'string' },
      },
    },
  })
  public speciesShadowed() {
    this.noContent()
  }

  @OpenAPI(HandWrittenEnumSerializer, {
    status: 200,
  })
  public handWrittenEnum() {
    this.ok()
  }
}

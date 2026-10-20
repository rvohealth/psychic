import { PsychicOpenapiNames } from '../../../../src/controller/index.js'
import { OpenAPI } from '../../../../src/package-exports/index.js'
import Pet from '../models/Pet.js'
import {
  BalloonColorResponseSerializer,
  BalloonTypeLatexSubsetSerializer,
  BalloonTypeMylarSubsetSerializer,
  HandWrittenEnumSerializer,
  PetTreatsResponseSerializer,
} from '../serializers/EnumSyncTestSerializer.js'
import ApplicationController from './ApplicationController.js'

/**
 * Fixture endpoints for the OpenAPI-derived enum sync unit specs, scoped to
 * the `mobile` spec (which sets `suppressResponseEnums: true`).
 *
 * Each pg enum reaches the `mobile` spec through one kind of site:
 * - balloon_colors_enum: ONLY a response serializer (proves suppressed specs
 *   still collect real values)
 * - balloon_types_enum: ONLY two serializer subset overrides of the STI type
 *   column (`['BalloonLatex']` and `['BalloonMylar']`): the export must be
 *   the union of both subsets
 * - pet_treats_enum: ONLY a response serializer of an array column
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

  @OpenAPI(BalloonTypeLatexSubsetSerializer, {
    status: 200,
  })
  public typeLatexSubset() {
    this.ok()
  }

  @OpenAPI(BalloonTypeMylarSubsetSerializer, {
    status: 200,
  })
  public typeMylarSubset() {
    this.ok()
  }

  @OpenAPI(PetTreatsResponseSerializer, {
    status: 200,
  })
  public treatsResponse() {
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

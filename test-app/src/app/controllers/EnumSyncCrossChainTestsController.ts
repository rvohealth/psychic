import { PsychicOpenapiNames } from '../../../../src/controller/index.js'
import { OpenAPI } from '../../../../src/package-exports/index.js'
import {
  BalloonTypeLatexSubsetSerializer,
  BalloonTypeResponseSerializer,
} from '../serializers/EnumSyncTestSerializer.js'
import ApplicationController from './ApplicationController.js'

/**
 * Fixture endpoints for the OpenAPI-derived enum sync unit specs, scoped to
 * the `enumTest` spec.
 *
 * - balloon_types_enum appears via a subset override of the STI type column
 *   (`['BalloonLatex']`) AND via a serializer that renders the column without
 *   an override (and so renders the full pg value set): the export must be
 *   the full set
 */
export default class EnumSyncCrossChainTestsController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<EnumSyncCrossChainTestsController> {
    return ['enumTest']
  }

  @OpenAPI(BalloonTypeLatexSubsetSerializer, {
    status: 200,
  })
  public typeLatexSubset() {
    this.ok()
  }

  @OpenAPI(BalloonTypeResponseSerializer, {
    status: 200,
  })
  public typeResponse() {
    this.ok()
  }
}

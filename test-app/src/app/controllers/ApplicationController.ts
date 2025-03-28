import { PsychicController } from '../../../../src/index.js'
import psychicTypes from '../../types/psychic.js'

export default class ApplicationController extends PsychicController {
  public override get psychicTypes() {
    return psychicTypes
  }
}

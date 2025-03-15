import { PsychicController } from '../../../../src/index.js'
import psychicTypes from '../../types/psychic.js'

export default class ApplicationController extends PsychicController {
  public get psychicTypes() {
    return psychicTypes
  }
}

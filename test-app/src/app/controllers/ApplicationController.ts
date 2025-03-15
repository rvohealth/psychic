import { PsychicController } from '../../../../src.js'
import psychicTypes from '../../types/psychic.js'

export default class ApplicationController extends PsychicController {
  public get psychicTypes() {
    return psychicTypes
  }
}

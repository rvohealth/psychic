import { PsychicController } from '../../../../src'
import psychicTypes from '../../types/psychic'

export default class ApplicationController extends PsychicController {
  public get psychicTypes() {
    return psychicTypes
  }
}

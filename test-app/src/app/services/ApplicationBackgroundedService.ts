import { BaseBackgroundedService } from '../../../../src'
import psychicTypes from '../../types/psychic'

export default class ApplicationBackgroundedService extends BaseBackgroundedService {
  public get psychicTypes() {
    return psychicTypes
  }
}

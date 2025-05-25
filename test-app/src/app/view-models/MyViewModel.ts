import { DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '../models/ApplicationModel.js'

export default class MyViewModel {
  public name: string | undefined
  public favoriteNumber: number | undefined

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'ViewModels/MyViewModelSerializer',
      somethingElse: 'ViewModels/MyViewModelSummarySerializer',
    }
  }
}

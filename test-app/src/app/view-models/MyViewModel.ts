import { DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '../models/ApplicationModel.js'
import Balloon from '../models/Balloon.js'

export default class MyViewModel {
  public name: string | undefined
  public favoriteNumber: number | undefined

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'ViewModels/MyViewModelSerializer',
      somethingElse: 'ViewModels/MyViewModelSummarySerializer',
    }
  }

  public myHasOne: MyViewModel
  public myHasMany: MyViewModel[]
  public balloons: Balloon[]
}

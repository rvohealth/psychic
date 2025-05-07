import { DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '../models/ApplicationModel.js'

export default class MyViewModel {
  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'view-models/MyViewModelSerializer',
      somethingElse: 'view-models/MyViewModelSummarySerializer',
    }
  }
}

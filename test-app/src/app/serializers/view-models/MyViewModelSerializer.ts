import { Attribute, DreamSerializer } from '@rvoh/dream'
import MyViewModel from '../../view-models/MyViewModel.js'

export class MyViewModelSummarySerializer<
  DataType extends MyViewModel,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public name: string
}

export default class MyViewModelSerializer<
  DataType extends MyViewModel,
  Passthrough extends object,
> extends MyViewModelSummarySerializer<DataType, Passthrough> {
  @Attribute('number')
  public favoriteNumber: number
}

import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import Balloon from '../models/Balloon.js'

export class BalloonSummarySerializer<
  DataType extends Balloon,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(Balloon)
  public id: DreamColumn<Balloon, 'id'>
}

export default class BalloonSerializer<
  DataType extends Balloon,
  Passthrough extends object,
> extends BalloonSummarySerializer<DataType, Passthrough> {
  @Attribute(Balloon)
  public color: DreamColumn<Balloon, 'color'>
}

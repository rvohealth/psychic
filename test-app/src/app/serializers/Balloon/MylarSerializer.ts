import { Attribute } from '@rvoh/dream'
import BalloonMylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer, { BalloonSummarySerializer } from '../BalloonSerializer.js'

export class MylarSummarySerializer<
  DataType extends BalloonMylar,
  Passthrough extends object,
> extends BalloonSummarySerializer<DataType, Passthrough> {
  @Attribute('string')
  public mylarOnlySummaryAttr(): string {
    return 'mylar-only-summary'
  }
}

export default class MylarSerializer<
  DataType extends BalloonMylar,
  Passthrough extends object,
> extends BalloonSerializer<DataType, Passthrough> {
  @Attribute('string')
  public mylarOnlyAttr(): string {
    return 'mylar-only-detailed'
  }
}

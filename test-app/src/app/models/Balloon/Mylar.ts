import { STI } from '@rvoh/dream'
import MylarSerializer, { MylarSummarySerializer } from '../../serializers/Balloon/MylarSerializer.js'
import { BalloonSummarySerializer } from '../../serializers/BalloonSerializer.js'
import Balloon from '../Balloon.js'

// const deco = new Decorators<typeof BalloonMylar>()

@STI(Balloon)
export default class BalloonMylar extends Balloon {
  public get serializers() {
    return {
      default: MylarSerializer,
      summary: MylarSummarySerializer,
      sameForAllSti: BalloonSummarySerializer,
    }
  }
}

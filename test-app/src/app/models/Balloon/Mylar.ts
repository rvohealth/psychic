import { DreamSerializers, STI } from '@rvoh/dream'
import Balloon from '../Balloon.js'

// const deco = new Decorators<typeof BalloonMylar>()

@STI(Balloon)
export default class BalloonMylar extends Balloon {
  public get serializers(): DreamSerializers<BalloonMylar> {
    return {
      default: 'Balloon/MylarSerializer',
    }
  }
}

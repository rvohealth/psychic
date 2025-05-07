import { DreamSerializers, STI } from '@rvoh/dream'
import Balloon from '../Balloon.js'

// const deco = new Decorators<typeof BalloonLatex>()

@STI(Balloon)
export default class BalloonLatex extends Balloon {
  public get serializers(): DreamSerializers<BalloonLatex> {
    return {
      default: 'Balloon/LatexSerializer',
      summary: 'Balloon/LatexSummarySerializer',
    }
  }
}

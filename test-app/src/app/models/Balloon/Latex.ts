import { STI } from '@rvoh/dream'
import LatexSerializer, { LatexSummarySerializer } from '../../serializers/Balloon/LatexSerializer.js'
import Balloon from '../Balloon.js'

// const deco = new Decorators<typeof BalloonLatex>()

@STI(Balloon)
export default class BalloonLatex extends Balloon {
  public get serializers() {
    return {
      default: LatexSerializer,
      summary: LatexSummarySerializer,
    }
  }
}

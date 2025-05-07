import { Attribute } from '@rvoh/dream'
import BalloonLatex from '../../models/Balloon/Latex.js'
import BalloonSerializer, { BalloonSummarySerializer } from '../BalloonSerializer.js'

export class LatexSummarySerializer<
  DataType extends BalloonLatex,
  Passthrough extends object,
> extends BalloonSummarySerializer<DataType, Passthrough> {
  @Attribute('string')
  public latexOnlySummaryAttr(): string {
    return 'latex-only-summary'
  }
}

export default class LatexSerializer<
  DataType extends BalloonLatex,
  Passthrough extends object,
> extends BalloonSerializer<DataType, Passthrough> {
  @Attribute('string')
  public latexOnlyAttr(): string {
    return 'latex-only-detailed'
  }
}

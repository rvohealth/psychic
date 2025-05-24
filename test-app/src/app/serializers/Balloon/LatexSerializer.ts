import BalloonLatex from '../../models/Balloon/Latex.js'
import BalloonSerializer, { BalloonSummarySerializer } from '../BalloonSerializer.js'

export const LatexSummarySerializer = (data: BalloonLatex, passthrough: object) =>
  BalloonSummarySerializer(data, passthrough).customAttribute(
    'latexOnlySummaryAttr',
    () => 'latex-only-summary',
    { openapi: 'string' },
  )

export default (data: BalloonLatex, passthrough: object) =>
  BalloonSerializer(data, passthrough).customAttribute('latexOnlyAttr', () => 'latex-only-detailed', {
    openapi: 'string',
  })

import BalloonLatex from '../../models/Balloon/Latex.js'
import BalloonSerializer, { BalloonSummarySerializer } from '../BalloonSerializer.js'

export const LatexSummarySerializer = (data: BalloonLatex, passthrough: object) =>
  BalloonSummarySerializer(data, passthrough).customAttribute(
    'latexOnlySummaryAttr',
    () => 'latex-only-summary',
    { openapi: 'string' },
  )

const LatexSerializer = (data: BalloonLatex, passthrough: object) =>
  BalloonSerializer(data, passthrough).customAttribute('latexOnlyAttr', () => 'latex-only-detailed', {
    openapi: 'string',
  })

export default LatexSerializer

// renders the child's own `type`, as an STI child serializer does when its
// OpenAPI names the one type it renders
export const LatexWithTypeSerializer = (data: BalloonLatex, passthrough: object) =>
  LatexSerializer(data, passthrough).attribute('type', {
    openapi: { type: 'string', enum: ['BalloonLatex'] },
  })

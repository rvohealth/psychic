import BalloonMylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer, { BalloonSummarySerializer } from '../BalloonSerializer.js'

export const MylarSummarySerializer = (data: BalloonMylar, passthrough: object) =>
  BalloonSummarySerializer(data, passthrough).customAttribute(
    'mylarOnlySummaryAttr',
    () => 'mylar-only-summary',
    { openapi: 'string' },
  )

export default (data: BalloonMylar, passthrough: object) =>
  BalloonSerializer(data, passthrough).customAttribute('mylarOnlyAttr', () => 'mylar-only-detailed', {
    openapi: 'string',
  })

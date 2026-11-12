import BalloonMylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer, { BalloonSummarySerializer } from '../BalloonSerializer.js'

export const MylarSummarySerializer = (data: BalloonMylar, passthrough: object) =>
  BalloonSummarySerializer(data, passthrough).customAttribute(
    'mylarOnlySummaryAttr',
    () => 'mylar-only-summary',
    { openapi: 'string' },
  )

const MylarSerializer = (data: BalloonMylar, passthrough: object) =>
  BalloonSerializer(data, passthrough).customAttribute('mylarOnlyAttr', () => 'mylar-only-detailed', {
    openapi: 'string',
  })

export default MylarSerializer

// renders the child's own `type`, as an STI child serializer does when its
// OpenAPI names the one type it renders
export const MylarWithTypeSerializer = (data: BalloonMylar, passthrough: object) =>
  MylarSerializer(data, passthrough).attribute('type', {
    openapi: { type: 'string', enum: ['BalloonMylar'] },
  })

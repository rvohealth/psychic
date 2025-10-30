import { OpenapiSchemaExpressionRef, OpenapiSchemaExpressionRefSchemaShorthand } from '@rvoh/dream/openapi'
import { OpenapiBodySegment } from '../body-segment.js'

export default function schemaToRef(bodySegment: OpenapiBodySegment): OpenapiSchemaExpressionRef {
  const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand
  return {
    $ref: `#/components/schemas/${schemaRefBodySegment.$schema.replace(/^#\/components\/schemas\//, '')}`,
  }
}

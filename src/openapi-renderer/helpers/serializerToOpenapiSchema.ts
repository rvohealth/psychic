import {
  DreamSerializer,
  DreamSerializerAssociationStatement,
  OpenapiSchemaArray,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiShorthandPrimitiveTypes,
  uniq,
} from '@rvohealth/dream'
import { envBool } from '../../helpers/envValue'
import OpenapiBodySegmentRenderer, { OpenapiBodyTarget, OpenapiEndpointParseResults } from '../body-segment'

/**
 * @internal
 *
 * builds the definition for the endpoint's serializer
 * to be placed in the components/schemas path
 */
export default function serializerToOpenapiSchema({
  serializerClass,
  schemaDelimeter,
  serializers,
  processedSchemas,
  target,
}: {
  serializerClass: typeof DreamSerializer
  serializers: { [key: string]: typeof DreamSerializer }
  schemaDelimeter: string
  processedSchemas: Record<string, boolean>
  target: OpenapiBodyTarget
}): Record<string, OpenapiSchemaObject> {
  if (processedSchemas[serializerClass.globalName]) return {}
  processedSchemas[serializerClass.globalName] = true

  const attributes = serializerClass['attributeStatements']
  const serializerKey = serializerClass.openapiName

  const serializerObject: OpenapiSchemaObject = {
    type: 'object',
    required: [],
    properties: {},
  }

  let componentsSchema = {} as { [key: string]: OpenapiSchemaObject }

  attributes.forEach(attr => {
    serializerObject.required!.push(attr.field)

    const { results, extraComponents } = recursivelyParseBody({
      bodySegment: attr.renderAs,
      serializers,
      schemaDelimeter,
      processedSchemas,
      target,
    })

    componentsSchema = { ...componentsSchema, ...extraComponents }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    ;(serializerObject as any).properties![attr.field] = results
  })

  const serializerPayload = attachAssociationsToSerializerPayload({
    serializerClass,
    serializerPayload: { [serializerKey]: serializerObject, ...componentsSchema },
    serializerKey,
    serializers,
    schemaDelimeter,
    processedSchemas,
    target,
  })

  return { ...serializerPayload, ...componentsSchema }
}

/**
 * @internal
 *
 * for each association existing on a given serializer,
 * attach the association's schema to the component schema
 * output, and also generate a $ref between the base
 * serializer and the new one.
 */
function attachAssociationsToSerializerPayload({
  serializerClass,
  serializerPayload,
  serializerKey,
  serializers,
  schemaDelimeter,
  processedSchemas,
  target,
}: {
  serializerClass: typeof DreamSerializer
  serializerPayload: Record<string, OpenapiSchemaObject>
  serializerKey: string
  serializers: { [key: string]: typeof DreamSerializer }
  schemaDelimeter: string
  processedSchemas: Record<string, boolean>
  target: OpenapiBodyTarget
}) {
  const associations = serializerClass['associationStatements']

  let finalOutput = { ...serializerPayload }

  associations.forEach(association => {
    const associatedSerializers = DreamSerializer.getAssociatedSerializersForOpenapi(association)
    if (!associatedSerializers)
      throw new Error(`
Error: ${serializerClass.name} missing explicit serializer definition for ${association.type} ${association.field}, using type: 'object'
`)

    if (associatedSerializers.length === 1) {
      // point the association directly to the schema
      finalOutput = addSingleSerializerAssociationToOutput({
        association,
        serializerKey,
        finalOutput,
        associatedSerializers,
        serializers,
        schemaDelimeter,
        processedSchemas,
        target,
      })
    } else {
      // leverage anyOf to handle an array of serializers
      finalOutput = addMultiSerializerAssociationToOutput({
        association,
        serializerKey,
        finalOutput,
        associatedSerializers,
        serializers,
        schemaDelimeter,
        processedSchemas,
        target,
      })
    }
  })

  return finalOutput
}

/**
 * @internal
 *
 * points an association directly to the $ref associated
 * with the target serializer, and add target serializer
 * to the schema
 */
function addSingleSerializerAssociationToOutput({
  associatedSerializers,
  finalOutput,
  serializerKey,
  association,
  serializers,
  schemaDelimeter,
  processedSchemas,
  target,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  associatedSerializers: (typeof DreamSerializer<any, any>)[]
  finalOutput: Record<string, OpenapiSchemaObject>
  serializerKey: string
  association: DreamSerializerAssociationStatement
  serializers: { [key: string]: typeof DreamSerializer }
  schemaDelimeter: string
  processedSchemas: Record<string, boolean>
  target: OpenapiBodyTarget
}) {
  const associatedSerializer = associatedSerializers[0]
  const associatedSerializerKey = associatedSerializer.openapiName

  if (envBool('DEBUG')) console.log(`Processing serializer ${associatedSerializerKey}`)

  finalOutput[serializerKey].required = uniq([
    ...(finalOutput[serializerKey].required || []),
    association.field,
  ])

  switch (association.type) {
    case 'RendersMany':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(finalOutput as any)[serializerKey].properties![association.field] = {
        type: 'array',
        items: {
          $ref: `#/components/schemas/${associatedSerializerKey}`,
        },
      }
      break

    case 'RendersOne':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(finalOutput as any)[serializerKey].properties![association.field] = accountForNullableOption(
        {
          $ref: `#/components/schemas/${associatedSerializerKey}`,
        },
        association.nullable,
      )
      break
  }

  const associatedSchema = serializerToOpenapiSchema({
    serializerClass: associatedSerializer,
    serializers,
    schemaDelimeter,
    processedSchemas,
    target,
  })

  finalOutput = { ...finalOutput, ...associatedSchema }

  return finalOutput
}

/**
 * @internal
 *
 * leverages anyOf to cast multiple possible $ref values,
 * each pointing to its respective target serializer.
 */
function addMultiSerializerAssociationToOutput({
  associatedSerializers,
  finalOutput,
  serializerKey,
  association,
  serializers,
  schemaDelimeter,
  processedSchemas,
  target,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  associatedSerializers: (typeof DreamSerializer<any, any>)[]
  finalOutput: Record<string, OpenapiSchemaObject>
  serializerKey: string
  association: DreamSerializerAssociationStatement
  serializers: { [key: string]: typeof DreamSerializer }
  schemaDelimeter: string
  processedSchemas: Record<string, boolean>
  target: OpenapiBodyTarget
}) {
  const anyOf: (OpenapiSchemaExpressionRef | OpenapiSchemaArray)[] = []

  associatedSerializers.forEach(associatedSerializer => {
    const associatedSerializerKey = associatedSerializer.openapiName

    if (envBool('DEBUG')) console.log(`Processing serializer ${associatedSerializerKey}`)

    finalOutput[serializerKey].required = uniq([
      ...(finalOutput[serializerKey].required || []),
      association.field,
    ])

    switch (association.type) {
      case 'RendersMany':
        anyOf.push({
          type: 'array',
          items: {
            $ref: `#/components/schemas/${associatedSerializerKey}`,
          },
        })
        break

      case 'RendersOne':
        anyOf.push({
          $ref: `#/components/schemas/${associatedSerializerKey}`,
        })
        break
    }

    const associatedSchema = serializerToOpenapiSchema({
      serializerClass: associatedSerializer,
      serializers,
      schemaDelimeter,
      processedSchemas,
      target,
    })

    finalOutput = { ...finalOutput, ...associatedSchema }
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  ;(finalOutput as any)[serializerKey].properties![association.field] = {
    anyOf,
  }

  return finalOutput
}

function recursivelyParseBody({
  bodySegment,
  serializers,
  schemaDelimeter,
  processedSchemas,
  target,
}: {
  bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
  serializers: { [key: string]: typeof DreamSerializer }
  schemaDelimeter: string
  processedSchemas: Record<string, boolean>
  target: OpenapiBodyTarget
}): OpenapiEndpointParseResults {
  return new OpenapiBodySegmentRenderer({
    bodySegment,
    serializers: serializers,
    schemaDelimeter: schemaDelimeter,
    processedSchemas,
    target,
  }).parse()
}

function accountForNullableOption<T>(bodySegment: T, nullable: boolean): T | OpenapiSchemaExpressionAllOf {
  if (nullable) {
    return {
      allOf: [bodySegment, { nullable: true }],
    } as OpenapiSchemaExpressionAllOf
  } else {
    return bodySegment
  }
}

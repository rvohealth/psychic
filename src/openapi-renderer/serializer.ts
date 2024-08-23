import {
  DreamSerializer,
  DreamSerializerAssociationStatement,
  OpenapiSchemaArray,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiShorthandPrimitiveTypes,
  SerializableTypes,
  uniq,
} from '@rvohealth/dream'
import { envBool } from '../helpers/envValue'
import OpenapiBodySegmentRenderer from './body-segment'

export default class OpenapiSerializerRenderer {
  private serializerClass: typeof DreamSerializer
  private serializers: { [key: string]: typeof DreamSerializer }
  private schemaDelimeter: string
  private processedSchemas: Record<string, boolean>
  private target: OpenapiBodyTarget

  /**
   * @internal
   *
   * Used to recursively parse nested object structures
   * within nested openapi objects
   */
  constructor({
    serializerClass,
    serializers,
    schemaDelimeter,
    processedSchemas,
    target,
  }: {
    serializerClass: typeof DreamSerializer
    serializers: { [key: string]: typeof DreamSerializer }
    schemaDelimeter: string
    processedSchemas: Record<string, boolean>
    target: OpenapiBodyTarget
  }) {
    this.serializerClass = serializerClass
    this.serializers = serializers
    this.schemaDelimeter = schemaDelimeter
    this.processedSchemas = processedSchemas
    this.target = target
  }

  /**
   * converts the serializer to an openapi schema
   */
  public parse(): Record<string, OpenapiSchemaObject> {
    if (this.processedSchemas[this.serializerClass.globalName]) return {}
    this.processedSchemas[this.serializerClass.globalName] = true

    const attributes = this.serializerClass['attributeStatements']
    const serializerKey = this.serializerClass.openapiName

    const serializerObject: OpenapiSchemaObject = {
      type: 'object',
      required: [],
      properties: {},
    }

    let componentsSchema = {} as { [key: string]: OpenapiSchemaObject }

    attributes.forEach(attr => {
      serializerObject.required!.push(attr.field)

      const { results, extraComponents } = this.recursivelyParseBody({ renderAs: attr.renderAs })

      componentsSchema = { ...componentsSchema, ...extraComponents }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(serializerObject as any).properties![attr.field] = results
    })

    const serializerPayload = this.attachAssociationsToSerializerPayload({
      serializerPayload: { [serializerKey]: serializerObject, ...componentsSchema },
      serializerKey,
    })

    return { ...serializerPayload, ...componentsSchema }
  }

  private recursivelyParseBody({ renderAs }: { renderAs?: SerializableTypes }): OpenapiEndpointParseResults {
    return new OpenapiBodySegmentRenderer({
      bodySegment: renderAs,
      serializers: this.serializers,
      schemaDelimeter: this.schemaDelimeter,
      processedSchemas: this.processedSchemas,
      target: this.target,
    }).parse()
  }

  /**
   * @internal
   *
   * for each association existing on a given serializer,
   * attach the association's schema to the component schema
   * output, and also generate a $ref between the base
   * serializer and the new one.
   */
  private attachAssociationsToSerializerPayload({
    serializerPayload,
    serializerKey,
  }: {
    serializerPayload: Record<string, OpenapiSchemaObject>
    serializerKey: string
  }) {
    const associations = this.serializerClass['associationStatements']

    let finalOutput = { ...serializerPayload }

    associations.forEach(association => {
      const associatedSerializers = DreamSerializer.getAssociatedSerializersForOpenapi(association)
      if (!associatedSerializers)
        throw new Error(`
Error: ${this.serializerClass.name} missing explicit serializer definition for ${association.type} ${association.field}, using type: 'object'
`)

      if (associatedSerializers.length === 1) {
        // point the association directly to the schema
        finalOutput = this.addSingleSerializerAssociationToOutput({
          association,
          serializerKey,
          finalOutput,
          associatedSerializers,
        })
      } else {
        // leverage anyOf to handle an array of serializers
        finalOutput = this.addMultiSerializerAssociationToOutput({
          association,
          serializerKey,
          finalOutput,
          associatedSerializers,
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
  private addSingleSerializerAssociationToOutput({
    associatedSerializers,
    finalOutput,
    serializerKey,
    association,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    associatedSerializers: (typeof DreamSerializer<any, any>)[]
    finalOutput: Record<string, OpenapiSchemaObject>
    serializerKey: string
    association: DreamSerializerAssociationStatement
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
        ;(finalOutput as any)[serializerKey].properties![association.field] = this.accountForNullableOption(
          {
            $ref: `#/components/schemas/${associatedSerializerKey}`,
          },
          association.nullable,
        )
        break
    }

    const associatedSchema = new OpenapiSerializerRenderer({
      serializerClass: associatedSerializer,
      serializers: this.serializers,
      schemaDelimeter: this.schemaDelimeter,
      processedSchemas: this.processedSchemas,
      target: this.target,
    }).parse()

    finalOutput = { ...finalOutput, ...associatedSchema }

    return finalOutput
  }

  /**
   * @internal
   *
   * leverages anyOf to cast multiple possible $ref values,
   * each pointing to its respective target serializer.
   */
  private addMultiSerializerAssociationToOutput({
    associatedSerializers,
    finalOutput,
    serializerKey,
    association,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    associatedSerializers: (typeof DreamSerializer<any, any>)[]
    finalOutput: Record<string, OpenapiSchemaObject>
    serializerKey: string
    association: DreamSerializerAssociationStatement
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

      const associatedSchema = new OpenapiSerializerRenderer({
        serializerClass: associatedSerializer,
        serializers: this.serializers,
        schemaDelimeter: this.schemaDelimeter,
        processedSchemas: this.processedSchemas,
        target: this.target,
      }).parse()

      finalOutput = { ...finalOutput, ...associatedSchema }
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    ;(finalOutput as any)[serializerKey].properties![association.field] = {
      anyOf,
    }

    return finalOutput
  }

  private accountForNullableOption<T>(bodySegment: T, nullable: boolean): T | OpenapiSchemaExpressionAllOf {
    if (nullable) {
      return {
        allOf: [bodySegment, { nullable: true }],
      } as OpenapiSchemaExpressionAllOf
    } else {
      return bodySegment
    }
  }
}

export type OpenapiEndpointParseResults = {
  results: OpenapiSchemaBody
  extraComponents: { [key: string]: OpenapiSchemaObject }
}

export type OpenapiBodySegment =
  | OpenapiSchemaBodyShorthand
  | OpenapiShorthandPrimitiveTypes
  | { description: string }
  | undefined

export type OpenapiBodyTarget = 'request' | 'response'

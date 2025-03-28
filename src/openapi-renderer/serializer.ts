import {
  DreamSerializer,
  DreamSerializerAssociationStatement,
  OpenapiSchemaArray,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiSchemaObjectBase,
  OpenapiShorthandPrimitiveTypes,
  SerializableTypes,
  uniq,
} from '@rvoh/dream'
import PsychicController from '../controller/index.js'
import CannotFlattenMultiplePolymorphicRendersOneAssociations from '../error/openapi/CannotFlattenMultiplePolymorphicRendersOneAssociations.js'
import UnexpectedUndefined from '../error/UnexpectedUndefined.js'
import EnvInternal from '../helpers/EnvInternal.js'
import PsychicApplication from '../psychic-application/index.js'
import OpenapiBodySegmentRenderer from './body-segment.js'

export default class OpenapiSerializerRenderer {
  private openapiName: string
  private controllerClass: typeof PsychicController
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
    openapiName,
    controllerClass,
    serializerClass,
    serializers,
    schemaDelimeter,
    processedSchemas,
    target,
  }: {
    openapiName: string
    controllerClass: typeof PsychicController
    serializerClass: typeof DreamSerializer
    serializers: { [key: string]: typeof DreamSerializer }
    schemaDelimeter: string
    processedSchemas: Record<string, boolean>
    target: OpenapiBodyTarget
  }) {
    this.openapiName = openapiName
    this.controllerClass = controllerClass
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

      const { results, extraComponents } = this.recursivelyParseBody({ openApiShape: attr.openApiShape })

      componentsSchema = { ...componentsSchema, ...extraComponents }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(serializerObject as any).properties![attr.field] = results
    })

    serializerObject.required = uniq(serializerObject.required!)

    const serializerPayload = this.attachAssociationsToSerializerPayload({
      serializerPayload: { [serializerKey]: serializerObject, ...componentsSchema },
      serializerKey,
    })

    return { ...serializerPayload, ...componentsSchema }
  }

  private recursivelyParseBody({
    openApiShape,
  }: {
    openApiShape?: SerializableTypes
  }): OpenapiEndpointParseResults {
    return new OpenapiBodySegmentRenderer({
      openapiName: this.openapiName,
      controllerClass: this.controllerClass,
      bodySegment: openApiShape,
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
    let flattenedPolymorphicSchemas: string[] = []
    let flattenedPolymorphicAssociation: DreamSerializerAssociationStatement

    const finalOutputForSerializerKey = finalOutput[serializerKey]
    if (finalOutputForSerializerKey === undefined) throw new UnexpectedUndefined()

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
        const data = this.addMultiSerializerAssociationToOutput({
          association,
          serializerKey,
          finalOutput,
          associatedSerializers,
          flattenedPolymorphicSchemas,
          flattenedPolymorphicAssociation,
        })
        finalOutput = data.finalOutput
        flattenedPolymorphicSchemas = data.flattenedPolymorphicSchemas
        if (data.flattenedPolymorphicAssociation) {
          flattenedPolymorphicAssociation = data.flattenedPolymorphicAssociation
        }
      }
    })

    if (flattenedPolymorphicSchemas.length && flattenedPolymorphicAssociation!) {
      if (flattenedPolymorphicAssociation.optional) {
        return {
          ...finalOutput,
          [serializerKey]: {
            anyOf: [
              { ...finalOutputForSerializerKey },
              {
                allOf: [
                  { ...finalOutputForSerializerKey },
                  { anyOf: flattenedPolymorphicSchemas.map(schema => ({ $schema: schema })) },
                ],
              },
            ],
          },
        } as Record<string, OpenapiSchemaObject>
      } else {
        return {
          ...finalOutput,
          [serializerKey]: {
            allOf: [
              { ...finalOutputForSerializerKey },
              { anyOf: flattenedPolymorphicSchemas.map(schema => ({ $schema: schema })) },
            ],
          },
        } as Record<string, OpenapiSchemaObject>
      }
    } else {
      return finalOutput
    }
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
    if (associatedSerializer === undefined) throw new UnexpectedUndefined()
    const associatedSerializerKey = associatedSerializer.openapiName

    if (EnvInternal.isDebug) PsychicApplication.log(`Processing serializer ${associatedSerializerKey}`)

    let flattenedData: Record<string, OpenapiSchemaObject>
    const finalOutputForSerializerKey = finalOutput[serializerKey]
    if (finalOutputForSerializerKey === undefined) throw new UnexpectedUndefined()

    switch (association.type) {
      case 'RendersMany':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        ;(finalOutputForSerializerKey as any).properties![association.field] = {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${associatedSerializerKey}`,
          },
        }

        finalOutputForSerializerKey.required = uniq([
          ...(finalOutputForSerializerKey.required || []),
          association.field,
        ])
        break

      case 'RendersOne':
        if (association.flatten) {
          flattenedData = this.flattenRendersOneAssociation(associatedSerializer, {
            finalOutput,
            serializerKey,
          })

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          ;(finalOutput as any)[serializerKey].properties = flattenedData

          if (!association.optional) {
            finalOutputForSerializerKey.required = uniq([
              ...(finalOutputForSerializerKey.required || []),
              ...Object.keys(flattenedData),
            ])
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          ;(finalOutput as any)[serializerKey].properties![association.field] = this.accountForNullableOption(
            {
              $ref: `#/components/schemas/${associatedSerializerKey}`,
            },
            association.optional,
          )

          finalOutputForSerializerKey.required = uniq([
            ...(finalOutputForSerializerKey.required || []),
            association.field,
          ])
        }
        break
    }

    const associatedSchema = new OpenapiSerializerRenderer({
      openapiName: this.openapiName,
      controllerClass: this.controllerClass,
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
   * Takes an association and flattens each of it's child
   * attributes into a new object. This is done whenever
   * a serializer's @RendersOne options include `flatten: true`
   */
  private flattenRendersOneAssociation(
    associatedSerializer: typeof DreamSerializer,
    {
      finalOutput,
      serializerKey,
    }: {
      finalOutput: Record<string, OpenapiSchemaObject>
      serializerKey: string
    },
  ): Record<string, OpenapiSchemaObject> {
    const serialized = new OpenapiSerializerRenderer({
      openapiName: this.openapiName,
      controllerClass: this.controllerClass,
      serializerClass: associatedSerializer,
      serializers: this.serializers,
      schemaDelimeter: this.schemaDelimeter,
      processedSchemas: {},
      target: this.target,
    }).parse()

    const associatedProperties = (serialized[associatedSerializer.openapiName] as OpenapiSchemaObjectBase)
      .properties

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ...(finalOutput as any)[serializerKey].properties!,
      ...associatedProperties,
    } as Record<string, OpenapiSchemaObject>
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
    flattenedPolymorphicSchemas,
    flattenedPolymorphicAssociation,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    associatedSerializers: (typeof DreamSerializer<any, any>)[]
    finalOutput: Record<string, OpenapiSchemaObject>
    serializerKey: string
    association: DreamSerializerAssociationStatement
    flattenedPolymorphicSchemas: string[]
    flattenedPolymorphicAssociation: DreamSerializerAssociationStatement | null
  }) {
    const finalOutputForSerializerKey = finalOutput[serializerKey]
    if (finalOutputForSerializerKey === undefined) throw new UnexpectedUndefined()

    if (association.flatten) {
      if (flattenedPolymorphicSchemas.length)
        throw new CannotFlattenMultiplePolymorphicRendersOneAssociations(
          this.serializerClass,
          association.field,
        )

      associatedSerializers.forEach(associatedSerializer => {
        const associatedSchema = new OpenapiSerializerRenderer({
          openapiName: this.openapiName,
          controllerClass: this.controllerClass,
          serializerClass: associatedSerializer,
          serializers: this.serializers,
          schemaDelimeter: this.schemaDelimeter,
          processedSchemas: this.processedSchemas,
          target: this.target,
        }).parse()
        finalOutput = { ...finalOutput, ...associatedSchema }
      })

      return {
        finalOutput,
        flattenedPolymorphicSchemas: associatedSerializers.map(ser => ser.openapiName),
        flattenedPolymorphicAssociation: association,
      }
    } else {
      const anyOf: (OpenapiSchemaExpressionRef | OpenapiSchemaArray)[] = []

      associatedSerializers.forEach(associatedSerializer => {
        const associatedSerializerKey = associatedSerializer.openapiName

        if (EnvInternal.isDebug) PsychicApplication.log(`Processing serializer ${associatedSerializerKey}`)

        finalOutputForSerializerKey.required = uniq([
          ...(finalOutputForSerializerKey.required || []),
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
          openapiName: this.openapiName,
          controllerClass: this.controllerClass,
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
    }

    return { finalOutput, flattenedPolymorphicSchemas, flattenedPolymorphicAssociation }
  }

  private accountForNullableOption<T>(bodySegment: T, nullable: boolean): T | OpenapiSchemaExpressionAnyOf {
    if (nullable) {
      return {
        anyOf: [bodySegment, { type: 'null' }],
      } as OpenapiSchemaExpressionAnyOf
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

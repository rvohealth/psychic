/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dream, DreamApp } from '@rvoh/dream'
import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaShorthandExpressionSerializableRef,
  OpenapiSchemaShorthandExpressionSerializerRef,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import { DreamSerializerBuilder } from '@rvoh/dream/system'
import {
  BelongsToStatement,
  DreamModelSerializerType,
  HasManyStatement,
  HasOneStatement,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  SerializerCasing,
  SimpleObjectSerializerType,
  ViewModelClass,
} from '@rvoh/dream/types'
import { compact, snakeify, sort, sortBy, sortObjectByKey, uniq } from '@rvoh/dream/utils'
import { inspect } from 'node:util'
import AttemptedToDeriveDescendentSerializersFromNonSerializer from '../error/openapi/AttemptedToDeriveDescendentSerializersFromNonSerializer.js'
import ExpectedSerializerForRendersOneOrManyOption from '../error/openapi/ExpectedSerializerForRendersOneOrManyOption.js'
import NonSerializerPassedToSerializerOpenapiRenderer from '../error/openapi/NonSerializerPassedToSerializerOpenapiRenderer.js'
import NonSerializerSerializerOverrideProvided from '../error/openapi/NonSerializerSerializerOverrideProvided.js'
import NoSerializerFoundForRendersOneAndMany from '../error/openapi/NoSerializerFoundForRendersOneAndMany.js'
import ObjectSerializerRendersOneAndManyRequireClassType from '../error/openapi/ObjectSerializerRendersOneAndManyRequireClassType.js'
import isObject from '../helpers/isObject.js'
import allSerializersFromHandWrittenOpenapi from './helpers/allSerializersFromHandWrittenOpenapi.js'
import allSerializersToRefsInOpenapi from './helpers/allSerializersToRefsInOpenapi.js'
import { dreamColumnOpenapiShape } from './helpers/dreamColumnOpenapiShape.js'
import OpenapiEnumCollector from './helpers/OpenapiEnumCollector.js'
import openapiShorthandToOpenapi from './helpers/openapiShorthandToOpenapi.js'
const NULL_OBJECT_OPENAPI: OpenapiSchemaBody = { type: 'null' }

// what a flattened rendersOne or customAttribute spreads into the object, an
// `allOf` sibling of the serializer's own properties (see
// SerializerOpenapiRenderer#flattenedSibling)
interface FlattenedSibling {
  // the position of the attribute among the serializer's declarations, so a
  // later declaration of a key it spreads can shadow it
  attributeIndex: number
  // a `many` ref, rendered alone: an array spreads nothing
  opaque?: OpenapiSchemaBodyShorthand
  // the schema of each key the value may spread, by cased output name
  properties: Record<string, OpenapiSchemaBodyShorthand>
  // the keys every value spreads, null where the value does not supply them
  required: string[]
  // the ref of the one never-null serializer the value renders with, which
  // `properties` equals; kept unless a later declaration shadows one of its keys
  ref?: OpenapiSchemaBodyShorthand
}

// the keys one shape of a flattened value declares (see
// SerializerOpenapiRenderer#flattenedShapeKeys)
interface FlattenedShapeKeys {
  // the schema of each key, by cased output name
  schemas: Record<string, OpenapiSchemaBodyShorthand>
  // the keys the shape renders for certain: a serializer's required attributes
  certain: Record<string, true>
}

export default class SerializerOpenapiRenderer {
  private casing: SerializerCasing
  private suppressResponseEnums: boolean
  private enumCollector: OpenapiEnumCollector | undefined
  private flattenedSiblings: FlattenedSibling[] = []
  private walkingFlattenedSerializers = new Set<DreamModelSerializerType | SimpleObjectSerializerType>()

  constructor(
    private serializer: DreamModelSerializerType | SimpleObjectSerializerType,
    {
      casing = 'camel',
      suppressResponseEnums = false,
      enumCollector = undefined,
    }: {
      casing?: SerializerCasing
      suppressResponseEnums?: boolean
      enumCollector?: OpenapiEnumCollector | undefined
    } = {},
  ) {
    if (!DreamApp.system.isDreamSerializer(this.serializer))
      throw new NonSerializerPassedToSerializerOpenapiRenderer(this.serializer)
    this.casing = casing
    this.suppressResponseEnums = suppressResponseEnums
    this.enumCollector = enumCollector
  }

  public get globalName(): string {
    return (this.serializer as any).globalName ?? '--unnamed--'
  }

  public get openapiName(): string {
    return (this.serializer as any).openapiName ?? '--unnamed--'
  }

  public get serializerRef(): OpenapiSchemaExpressionRef {
    return {
      $ref: `#/components/schemas/${this.openapiName}`,
    }
  }

  private _serializerBuilder: DreamSerializerBuilder<any, any, any>

  private get serializerBuilder(): DreamSerializerBuilder<any, any, any> {
    if (this._serializerBuilder) return this._serializerBuilder
    this._serializerBuilder = this.serializer(undefined as any, undefined as any) as DreamSerializerBuilder<
      any,
      any,
      any
    >
    return this._serializerBuilder
  }

  public renderedOpenapi(
    alreadyExtractedDescendantSerializers: Record<string, boolean> = {},
  ): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
    alreadyExtractedDescendantSerializers[(this.serializer as any).globalName] = true

    const referencedSerializersAndOpenapiSchemaBodyShorthand = this._renderedOpenapi(
      alreadyExtractedDescendantSerializers,
    )

    if (this.flattenedSiblings.length) {
      // This schema's property lock lives only at the `allOf` wrapper (never
      // on the inline branch or the `$ref`'d siblings) so that all branches'
      // properties are visible to `unevaluatedProperties` for the union check.
      // The document builder (`OpenapiSegmentExpander`) keeps only the
      // `allOf`, with its `description` and `summary`, so the serializer's
      // component in the OpenAPI document carries no property lock, like
      // every other serializer's component.
      return {
        ...referencedSerializersAndOpenapiSchemaBodyShorthand,
        openapi: {
          type: 'object',
          allOf: [
            referencedSerializersAndOpenapiSchemaBodyShorthand.openapi,
            ...this.flattenedSiblings.map(flattenedSiblingOpenapi),
          ],
          unevaluatedProperties: false,
        } as OpenapiSchemaBodyShorthand,
      }
    } else {
      return referencedSerializersAndOpenapiSchemaBodyShorthand
    }
  }

  private _renderedOpenapi(
    alreadyExtractedDescendantSerializers: Record<string, boolean>,
  ): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
    const referencedSerializersAndAttributes = this.renderedOpenapiAttributes(
      alreadyExtractedDescendantSerializers,
    )

    const requiredProperties: string[] = compact(
      this.serializerBuilder['attributes'].map(attribute => {
        const attributeType = attribute.type
        switch (attributeType) {
          case 'attribute':
          case 'delegatedAttribute': {
            if (attribute.options?.required === false) return null
            return attribute.options?.as ?? attribute.name
          }
          case 'customAttribute': {
            if (attribute.options?.required === false) return null
            return attribute.options.flatten ? null : attribute.name
          }
          case 'rendersOne': {
            return attribute.options.flatten ? null : (attribute.options?.as ?? attribute.name)
          }
          case 'rendersMany': {
            return attribute.options?.as ?? attribute.name
          }
          default: {
            // protection so that if a new ValidationType is ever added, this will throw a type error at build time
            const _never: never = attributeType
            throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
          }
        }
      }),
    )

    return {
      referencedSerializers: referencedSerializersAndAttributes.referencedSerializers,
      openapi: {
        type: 'object',
        required: sort(uniq(requiredProperties.map(property => this.setCase(property)))).filter(
          property => property in referencedSerializersAndAttributes.attributes,
        ),
        properties: sortObjectByKey(referencedSerializersAndAttributes.attributes),
        // Property-level locks (`additionalProperties` / `unevaluatedProperties`)
        // are not emitted on leaf schemas: when a leaf is composed via `$ref`
        // inside an `allOf`, neither keyword sees properties contributed by
        // sibling branches, so a per-leaf lock incorrectly rejects flattened
        // properties. No component in the OpenAPI document carries a lock,
        // flattened or not: the `allOf` wrapper's `unevaluatedProperties: false`
        // (see `renderedOpenapi`) is dropped when the document is built, so
        // response validation accepts a key a serializer does not declare.
      },
    }
  }

  private renderedOpenapiAttributes(
    alreadyExtractedDescendantSerializers: Record<string, boolean> = {},
  ): ReferencedSerializersAndAttributes {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const DataTypeForOpenapi = $typeForOpenapi as typeof Dream | ViewModelClass | undefined
    let referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[] = []
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    // a later declaration of the same output key replaces the earlier
    // declaration's rendered schema, so enum collection cannot happen
    // immediately: values hidden by the winning declaration would leak into
    // the collector. Each declaration instead collects into its own buffer,
    // and only buffers whose rendered schema survives in the final property
    // map are flushed into the real collector after the reduce completes.
    const pendingEnumCollections: {
      outputAttributeName: string
      buffer: OpenapiEnumCollector
      schema: OpenapiSchemaBodyShorthand
    }[] = []

    const attributes = this.serializerBuilder['attributes']
    this.flattenedSiblings = []
    this.walkingFlattenedSerializers.add(this.serializer)

    renderedOpenapi = attributes.reduce((accumulator, attribute, attributeIndex) => {
      const attributeType = attribute.type
      let newlyReferencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[] = []

      accumulator = (() => {
        switch (attributeType) {
          ///////////////////////
          // custom attributes //
          ///////////////////////
          case 'customAttribute': {
            const outputAttributeName = this.setCase(attribute.name)
            const openapi = attribute.options.openapi

            newlyReferencedSerializers = allSerializersFromHandWrittenOpenapi(openapi)

            if (attribute.options.flatten) {
              this.flattenedSiblings.push(
                this.flattenedCustomAttributeSibling(attributeIndex, attribute, openapi),
              )
            } else {
              accumulator[outputAttributeName] = allSerializersToRefsInOpenapi(
                openapiShorthandToOpenapi(openapi as any),
              )
            }

            return accumulator
          }
          ////////////////////////////
          // end: custom attributes //
          ////////////////////////////

          //////////////////////////////////////////
          // attributes and delegated attributes //
          //////////////////////////////////////////
          case 'attribute':
          case 'delegatedAttribute': {
            const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
            const openapi = attribute.options.openapi

            newlyReferencedSerializers = allSerializersFromHandWrittenOpenapi(openapi)

            let target: any
            let delegatedAssociationOptional = false

            if (attributeType === 'delegatedAttribute' && (DataTypeForOpenapi as typeof Dream)?.isDream) {
              const source = DataTypeForOpenapi as typeof Dream
              const association:
                | BelongsToStatement<any, any, any, any>
                | HasManyStatement<any, any, any, any>
                | HasOneStatement<any, any, any, any>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                | undefined = source['getAssociationMetadata'](attribute.targetName)
              const associatedModelOrModels = association?.modelCB()
              target = Array.isArray(associatedModelOrModels)
                ? associatedModelOrModels[0]
                : associatedModelOrModels
              delegatedAssociationOptional = !!(association as BelongsToStatement<any, any, any, any>)
                ?.optional
            } else if (attributeType === 'delegatedAttribute') {
              target = undefined
            } else {
              target = DataTypeForOpenapi
            }

            const declarationEnumCollector = this.enumCollector ? new OpenapiEnumCollector() : undefined

            const resolvedSchema = allSerializersToRefsInOpenapi(
              (target as typeof Dream)?.isDream
                ? dreamColumnOpenapiShape(
                    (this.serializer as any).globalName,
                    target as typeof Dream,
                    attribute.name,
                    openapi,
                    {
                      suppressResponseEnums: this.suppressResponseEnums,
                      enumCollector: declarationEnumCollector,
                    },
                  )
                : openapiShorthandToOpenapi(openapi as any),
            )

            const optional =
              attributeType === 'delegatedAttribute' &&
              ((attribute.options as { optional?: boolean }).optional ?? delegatedAssociationOptional)

            const finalSchema: OpenapiSchemaBodyShorthand =
              optional && !openapiSchemaAcceptsNull(resolvedSchema)
                ? openapiSchemaWithNull(resolvedSchema)
                : resolvedSchema

            accumulator[outputAttributeName] = finalSchema

            if (declarationEnumCollector) {
              pendingEnumCollections.push({
                outputAttributeName,
                buffer: declarationEnumCollector,
                schema: finalSchema,
              })
            }

            return accumulator
          }
          /////////////////////////////////////////////
          // end:attributes and delegated attributes //
          /////////////////////////////////////////////

          //////////////////
          // rendersOnes  //
          //////////////////
          case 'rendersOne': {
            const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)

            try {
              const { associationOpts, serializers, referencedSerializersAndOpenapiSchemaBodyShorthand } =
                associationOpenapi(attribute, DataTypeForOpenapi, alreadyExtractedDescendantSerializers)
              const optional = attribute.options.optional ?? associationOpts.optional

              newlyReferencedSerializers =
                referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers

              if (attribute.options.flatten) {
                this.flattenedSiblings.push(
                  this.flattenedSibling(attributeIndex, flattenedAssociationShape(serializers, optional)),
                )
                //
              } else if (optional) {
                accumulator[outputAttributeName] = {
                  anyOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, NULL_OBJECT_OPENAPI],
                }
              } else {
                accumulator[outputAttributeName] = referencedSerializersAndOpenapiSchemaBodyShorthand.openapi
              }

              return accumulator
            } catch (error) {
              if (error instanceof CallingSerializersThrewError) {
                accumulator[outputAttributeName] = {
                  type: 'object',
                  additionalProperties: true as any,
                  description: `Serializer ${(this.serializer as unknown as { globalName: string })['globalName']} includes a rendersOne "${outputAttributeName}" with an OpenAPI shape that cannot be defined. This will break fast-json-stringify. Define the OpenAPI shape or fastJsonStringify on the endpoint.`,
                }
                return accumulator
              }

              if (error instanceof AttemptedToDeriveDescendentSerializersFromNonSerializer)
                throw new ExpectedSerializerForRendersOneOrManyOption(
                  'rendersOne',
                  this.globalName,
                  attribute,
                )
              throw error
            }
          }
          ///////////////////////
          // end: rendersOnes  //
          ///////////////////////

          ///////////////////
          // rendersManys  //
          ///////////////////
          case 'rendersMany': {
            const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)

            try {
              const { referencedSerializersAndOpenapiSchemaBodyShorthand } = associationOpenapi(
                attribute,
                DataTypeForOpenapi,
                alreadyExtractedDescendantSerializers,
              )

              newlyReferencedSerializers =
                referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers

              accumulator[outputAttributeName] = {
                type: 'array',
                items: referencedSerializersAndOpenapiSchemaBodyShorthand.openapi,
              }

              return accumulator
            } catch (error) {
              if (error instanceof CallingSerializersThrewError) {
                accumulator[outputAttributeName] = {
                  type: 'array',
                  items: { type: 'object', additionalProperties: true as any },
                  description: `Serializer ${(this.serializer as unknown as { globalName: string })['globalName']} includes a rendersMany "${outputAttributeName}" with an OpenAPI shape that cannot be defined. This will break fast-json-stringify. Define the OpenAPI shape or fastJsonStringify on the endpoint.`,
                }
                return accumulator
              }
              if (error instanceof AttemptedToDeriveDescendentSerializersFromNonSerializer)
                throw new ExpectedSerializerForRendersOneOrManyOption(
                  'rendersMany',
                  this.globalName,
                  attribute,
                )
              throw error
            }
          }
          ////////////////////////
          // end: rendersManys  //
          ////////////////////////

          default: {
            // protection so that if a new ValidationType is ever added, this will throw a type error at build time
            const _never: never = attributeType
            throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
          }
        }
      })()

      const recursiveNewlyReferencedSerializers = newlyReferencedSerializers.flatMap(serializer =>
        descendantSerializers(serializer, alreadyExtractedDescendantSerializers),
      )

      referencedSerializers = [
        ...referencedSerializers,
        ...newlyReferencedSerializers,
        ...recursiveNewlyReferencedSerializers,
      ]

      return accumulator
    }, renderedOpenapi)

    this.walkingFlattenedSerializers.delete(this.serializer)

    // a later declaration of a key wins the render: Dream spreads a flattened
    // value's keys over the keys rendered before it, and renders a later
    // attribute over those. So a key a flattened attribute spreads is dropped
    // from every declaration before it, and a key a later attribute renders is
    // dropped from the flattened attributes before it. Non-flattened
    // declarations of one key already replaced one another in the reduce.
    const claimed = new Set<string>()
    const claimedByFlattened = new Set<string>()
    const siblingsByAttribute = new Map(
      this.flattenedSiblings.map(sibling => [sibling.attributeIndex, sibling]),
    )
    for (let attributeIndex = attributes.length - 1; attributeIndex >= 0; attributeIndex--) {
      const sibling = siblingsByAttribute.get(attributeIndex)

      if (sibling) {
        for (const key of Object.keys(sibling.properties)) {
          if (claimed.has(key)) {
            delete sibling.properties[key]
            sibling.required = sibling.required.filter(requiredKey => requiredKey !== key)
            delete sibling.ref
          } else {
            claimed.add(key)
            claimedByFlattened.add(key)
          }
        }
      } else {
        const key = this.setCase(attributeOutputName(attributes[attributeIndex]!))
        if (claimedByFlattened.has(key)) delete renderedOpenapi[key]
        claimed.add(key)
      }
    }

    const enumCollector = this.enumCollector
    if (enumCollector) {
      for (const pending of pendingEnumCollections) {
        // reference identity with the final property map proves this
        // declaration's rendered schema is the one the spec exposes; any
        // buffer whose schema was shadowed by a later same-key declaration
        // (of any attribute type) is dropped unflushed
        if (renderedOpenapi[pending.outputAttributeName] === pending.schema) {
          const enumMap = pending.buffer.toEnumMap()
          for (const enumName of Object.keys(enumMap)) {
            enumCollector.collect(enumName, enumMap[enumName] ?? [])
          }
        }
      }
    }

    return {
      referencedSerializers: uniq(referencedSerializers, serializer => (serializer as any).globalName),
      attributes: renderedOpenapi,
    }
  }

  private get nullKeysOptions(): { casing: SerializerCasing } {
    return { casing: this.casing }
  }

  /**
   * @internal
   *
   * The `allOf` sibling for a customAttribute with `flatten: true`. With
   * `required: false`, its callback may return undefined, which spreads
   * nothing, so none of its keys is required.
   */
  private flattenedCustomAttributeSibling(
    attributeIndex: number,
    attribute: SerializerAttribute,
    openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  ): FlattenedSibling {
    const sibling = this.flattenedCustomAttributeValueSibling(attributeIndex, openapi)
    if (attribute.type === 'customAttribute' && attribute.options.required === false && !sibling.opaque) {
      sibling.required = []
      delete sibling.ref
    }
    return sibling
  }

  private flattenedCustomAttributeValueSibling(
    attributeIndex: number,
    openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  ): FlattenedSibling {
    const serializerRef = openapi as Partial<
      OpenapiSchemaShorthandExpressionSerializerRef & OpenapiSchemaShorthandExpressionSerializableRef
    >
    if (!isObject(openapi) || !(serializerRef.$serializer || serializerRef.$serializable))
      return this.flattenedSibling(attributeIndex, openapi)

    const { many, maybeNull, ...singleSerializerRef } = serializerRef

    // flattening an array would spread its indexes into this object, so a
    // flattened `many` has no faithful shape; it renders the ref(s) alone, as
    // it did before `many` was expanded
    if (many)
      return {
        attributeIndex,
        opaque: allSerializersToRefsInOpenapi(singleSerializerRef as OpenapiSchemaBodyShorthand),
        properties: {},
        required: [],
      }

    return this.flattenedSibling(
      attributeIndex,
      (maybeNull
        ? { anyOf: [singleSerializerRef, NULL_OBJECT_OPENAPI] }
        : singleSerializerRef) as OpenapiSchemaBodyShorthand,
    )
  }

  /**
   * @internal
   *
   * The `allOf` sibling for a flattened rendersOne or customAttribute: what
   * Dream spreads into this object for `shape`, the openapi shorthand of the
   * value it flattens (see `flattenedAssociationShape` for a rendersOne; a
   * customAttribute's is its `openapi`, with `maybeNull` as a `{ type: 'null' }`
   * member).
   *
   * Flattening spreads the nested value's fields into this object, and every
   * payload carries one fixed key set whichever shape the value takes: Dream
   * renders every key `shape` requires (`DreamApp.system.nullFlattenedOpenapiKeys`)
   * as null where the value does not supply it (the value is null, the shape
   * it took does not declare the key, or a callback's object left it out),
   * with the value's own keys over that. So the sibling is one object whose
   * properties are every key any shape of `shape` declares, the shapes
   * `DreamApp.system.flattenedOpenapiVariants` lists (the children of an STI
   * base, the targets of a polymorphic BelongsTo, the members of an `anyOf`
   * or `oneOf`), each with the first schema declared for it; whose required
   * keys are the keys Dream always renders; and where a required key's schema
   * accepts null unless every shape is a serializer that renders the key
   * itself (only a null value, another shape, or a callback leaves a key
   * out). Dream lists the shapes and computes the keys, so the document
   * cannot drift from what it renders. The one shape of a never-null
   * serializer is identical to its ref, which is kept.
   */
  private flattenedSibling(
    attributeIndex: number,
    shape: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  ): FlattenedSibling {
    const listed = DreamApp.system.flattenedOpenapiVariants(shape)
    const variants = listed.length ? listed : [shape]
    const maybeNull = variants.some(isNullSchema)
    const shapes = variants.filter(variant => !isNullSchema(variant))
    const shapeKeys = shapes.map(variant => this.flattenedShapeKeys(variant))
    const required = sort(Object.keys(DreamApp.system.nullFlattenedOpenapiKeys(shape, this.nullKeysOptions)))

    const properties: Record<string, OpenapiSchemaBodyShorthand> = {}
    for (const { schemas } of shapeKeys) {
      for (const [key, schema] of Object.entries(schemas)) {
        if (!(key in properties)) properties[key] = schema
      }
    }

    for (const key of required) {
      const schema = properties[key]
      if (schema === undefined) continue
      const certain = !maybeNull && shapeKeys.every(({ certain }) => certain[key])
      if (!certain && !openapiSchemaAcceptsNull(schema)) properties[key] = openapiSchemaWithNull(schema)
    }

    const onlyShape = shapes.length === 1 ? shapes[0] : undefined
    return onlyShape !== undefined && !maybeNull && isSerializerRef(onlyShape)
      ? {
          attributeIndex,
          properties,
          required,
          ref: allSerializersToRefsInOpenapi(openapiShorthandToOpenapi(onlyShape as any)),
        }
      : { attributeIndex, properties, required }
  }

  /**
   * @internal
   *
   * The keys one shape of a flattened value declares (see `flattenedSibling`):
   * a serializer's rendered keys, its own and those its flattened attributes
   * spread, all of which its required attributes render for certain; or a
   * hand-written shape's `properties`, cased as this serializer's keys are
   * (Dream cases a flattened plain object's keys with the render), none of
   * them certain, since a callback's object may leave any of them out, joined
   * with the keys its `allOf` members declare. A shape with several shapes of
   * its own (a `$serializable` ref to an STI base, a nested `anyOf` or
   * `oneOf`) declares the keys any of them declares, and is certain only of a
   * key all of them are. A `many` ref declares none: a list has no keys to
   * spread.
   */
  private flattenedShapeKeys(
    shape: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  ): FlattenedShapeKeys {
    const keys: FlattenedShapeKeys = { schemas: {}, certain: {} }
    if (!isObject(shape)) return keys
    const record = shape as Record<string, any>
    if (record.many) return keys

    if (record.$serializer) {
      const renderer = new SerializerOpenapiRenderer(record.$serializer, {
        casing: this.casing,
        suppressResponseEnums: this.suppressResponseEnums,
        enumCollector: this.enumCollector,
      })
      keys.schemas = renderer.flattenedKeySchemas(this.walkingFlattenedSerializers)
      for (const key of Object.keys(DreamApp.system.nullFlattenedOpenapiKeys(shape, this.nullKeysOptions)))
        keys.certain[key] = true
      return keys
    }

    const alternatives = DreamApp.system.flattenedOpenapiVariants(shape)
    if (alternatives.length) {
      const alternativeKeys = alternatives.map(alternative => this.flattenedShapeKeys(alternative))
      for (const { schemas } of alternativeKeys) {
        for (const [key, schema] of Object.entries(schemas)) {
          if (!(key in keys.schemas)) keys.schemas[key] = schema
        }
      }
      for (const key of Object.keys(keys.schemas)) {
        if (alternativeKeys.every(({ certain }) => certain[key])) keys.certain[key] = true
      }
      return keys
    }

    if (isObject(record.properties)) {
      for (const [key, property] of Object.entries(record.properties as Record<string, any>))
        keys.schemas[this.setCase(key)] = allSerializersToRefsInOpenapi(openapiShorthandToOpenapi(property))
    }

    if (Array.isArray(record.allOf)) {
      for (const member of record.allOf as OpenapiSchemaBodyShorthand[]) {
        const memberKeys = this.flattenedShapeKeys(member)
        for (const [key, schema] of Object.entries(memberKeys.schemas)) {
          if (!(key in keys.schemas)) keys.schemas[key] = schema
        }
        Object.assign(keys.certain, memberKeys.certain)
      }
    }

    return keys
  }

  /**
   * @internal
   *
   * The schema of every key this serializer renders, its own and those its
   * flattened attributes spread, by cased output name, for a serializer
   * flattening it (see `flattenedShapeKeys`). `walking` holds the serializers
   * being read through their flattened attributes: one reached again adds
   * nothing, as in Dream's own walk.
   */
  private flattenedKeySchemas(
    walking: Set<DreamModelSerializerType | SimpleObjectSerializerType>,
  ): Record<string, OpenapiSchemaBodyShorthand> {
    if (walking.has(this.serializer)) return {}
    this.walkingFlattenedSerializers = walking

    const schemas: Record<string, OpenapiSchemaBodyShorthand> = {
      ...this.renderedOpenapiAttributes().attributes,
    }
    for (const sibling of this.flattenedSiblings) Object.assign(schemas, sibling.properties)
    return schemas
  }

  private setCase(attr: string) {
    switch (this.casing) {
      case 'camel':
        return attr
      case 'snake':
        return snakeify(attr)
      default: {
        // protection so that if a new Casing is ever added, this will throw a type error at build time
        const _never: never = this.casing
        throw new Error(`Unhandled Casing: ${_never as string}`)
      }
    }
  }
}

function associationOpenapi(
  attribute:
    | InternalAnyTypedSerializerRendersOne<any, string>
    | InternalAnyTypedSerializerRendersMany<any, string>,
  DataTypeForOpenapi: typeof Dream | ViewModelClass | undefined,
  alreadyExtractedDescendantSerializers: Record<string, boolean>,
): {
  associationOpts: { optional: boolean }
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  referencedSerializersAndOpenapiSchemaBodyShorthand: ReferencedSerializersAndOpenapiSchemaBodyShorthand
} {
  const { optional, serializers } = associationSerializers(attribute, DataTypeForOpenapi)

  if (serializers.length === 1) {
    const serializer = serializers[0]!
    try {
      return {
        associationOpts: { optional },
        serializers,
        referencedSerializersAndOpenapiSchemaBodyShorthand: {
          referencedSerializers: [
            serializer,
            ...descendantSerializers(serializer, alreadyExtractedDescendantSerializers),
          ],
          openapi: new SerializerOpenapiRenderer(serializer).serializerRef,
        },
      }
    } catch (error) {
      // a lone serializer is the `serializer` override when one is given (see
      // associationSerializers); an inferred serializer is always a serializer
      const serializerOverride = attribute.options.serializer
      if (error instanceof NonSerializerPassedToSerializerOpenapiRenderer && serializerOverride)
        throw new NonSerializerSerializerOverrideProvided(attribute, serializerOverride)
      throw error
    }
  }

  return {
    associationOpts: { optional },
    serializers,
    referencedSerializersAndOpenapiSchemaBodyShorthand: {
      referencedSerializers: [
        ...serializers,
        ...serializers.flatMap(serializer =>
          descendantSerializers(serializer, alreadyExtractedDescendantSerializers),
        ),
      ],
      openapi: {
        anyOf: sortBy(
          serializers.map(serializer => new SerializerOpenapiRenderer(serializer).serializerRef),
          ref => (ref['$ref'] ? ref['$ref'] : inspect(ref, { depth: 2 })),
        ),
      },
    },
  }
}

// the serializers a rendersOne/rendersMany renders its association with, and
// whether that association may be null
function associationSerializers(
  attribute:
    | InternalAnyTypedSerializerRendersOne<any, string>
    | InternalAnyTypedSerializerRendersMany<any, string>,
  DataTypeForOpenapi: typeof Dream | ViewModelClass | undefined,
): {
  optional: boolean
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
} {
  const association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | undefined =
    (DataTypeForOpenapi as typeof Dream)?.isDream &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (DataTypeForOpenapi as typeof Dream)['getAssociationMetadata'](attribute.name)

  // whether the association may be null is a property of the association, not
  // of the serializer that renders it, so a serializer override keeps it
  const optional: boolean = !!(association as BelongsToStatement<any, any, any, any>)?.optional

  const serializerOverride = attribute.options.serializer
  if (serializerOverride) return { optional, serializers: [serializerOverride] }

  let associatedClasses: (typeof Dream | ViewModelClass)[]

  if (association) {
    associatedClasses = DreamApp.system.expandStiClasses(association.modelCB())
    //
  } else {
    const associatedClass: typeof Dream | ViewModelClass | undefined =
      attribute.options.dreamClass ?? attribute.options.viewModelClass

    if (associatedClass === undefined) {
      let serializerCheck: DreamModelSerializerType | SimpleObjectSerializerType | undefined

      try {
        serializerCheck = (DataTypeForOpenapi as ViewModelClass)?.prototype?.serializers
      } catch {
        throw new CallingSerializersThrewError()
      }

      if (serializerCheck) throw new ObjectSerializerRendersOneAndManyRequireClassType(attribute.name)
      throw new ObjectSerializerRendersOneAndManyRequireClassType(attribute.name)
    }

    associatedClasses = [associatedClass]
  }

  const serializers = uniq(
    associatedClasses.flatMap(associatedClass =>
      DreamApp.system.inferSerializersFromDreamClassOrViewModelClass(
        associatedClass,
        attribute.options.serializerKey,
      ),
    ),
  )

  if (serializers.length === 0) throw new NoSerializerFoundForRendersOneAndMany(attribute.name)

  return { optional, serializers }
}

// the openapi shorthand of what a flattened rendersOne spreads into the object
// (see SerializerOpenapiRenderer#flattenedOpenapi): a ref to each serializer it
// may render with (several for an STI base or a polymorphic BelongsTo), and
// null when the association may be absent
function flattenedAssociationShape(
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
  optional: boolean,
): OpenapiSchemaBodyShorthand {
  const refs = sortBy(serializers, serializer => new SerializerOpenapiRenderer(serializer).openapiName).map(
    serializer => ({ $serializer: serializer }),
  )

  if (refs.length === 1 && !optional) return refs[0] as OpenapiSchemaBodyShorthand
  return { anyOf: optional ? [...refs, NULL_OBJECT_OPENAPI] : refs } as OpenapiSchemaBodyShorthand
}

function flattenedSiblingOpenapi(sibling: FlattenedSibling): OpenapiSchemaBodyShorthand {
  if (sibling.opaque) return sibling.opaque
  if (sibling.ref) return sibling.ref
  return {
    type: 'object',
    ...(sibling.required.length ? { required: sibling.required } : {}),
    properties: sortObjectByKey(sibling.properties),
  } as OpenapiSchemaBodyShorthand
}

function isSerializerRef(openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes): boolean {
  return isObject(openapi) && !!(openapi as Record<string, unknown>).$serializer
}

function isNullSchema(openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes): boolean {
  return openapi === 'null' || (isObject(openapi) && (openapi as Record<string, unknown>).type === 'null')
}

// the key an attribute renders in the object, before casing
function attributeOutputName(attribute: SerializerAttribute): string {
  const attributeType = attribute.type
  switch (attributeType) {
    case 'attribute':
    case 'delegatedAttribute':
    case 'rendersOne':
    case 'rendersMany':
      return attribute.options?.as ?? attribute.name

    case 'customAttribute':
      return attribute.name

    default: {
      // protection so that if a new ValidationType is ever added, this will throw a type error at build time
      const _never: never = attributeType
      throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
    }
  }
}

function descendantSerializers(
  serializer: DreamModelSerializerType | SimpleObjectSerializerType,
  alreadyExtractedDescendantSerializers: Record<string, boolean>,
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  // alreadyExtractedDescendantSerializers is used not only to avoid duplicate
  // work (and thereby speed up OpenAPI spec generation), but also to avoid
  // infinite loops (a recursive OpenAPI structure is valid)
  if (alreadyExtractedDescendantSerializers[(serializer as any).globalName]) return []

  if (!DreamApp.system.isDreamSerializer(serializer))
    throw new AttemptedToDeriveDescendentSerializersFromNonSerializer(serializer)

  const immediateDescendantSerializers = new SerializerOpenapiRenderer(serializer).renderedOpenapi(
    alreadyExtractedDescendantSerializers,
  ).referencedSerializers

  return [
    ...immediateDescendantSerializers,
    ...immediateDescendantSerializers.flatMap(descendantSerializer =>
      descendantSerializers(descendantSerializer, alreadyExtractedDescendantSerializers),
    ),
  ]
}

// When attempting to expand STI children, we might call `.serializers` on
// an instance that throws an error just by calling `.serializers` (so that
// they can be sure to define serializers on the STI children, but in this
// case, there might be STI children that are intermediaries to the intended
// STI children, so they don't have serializers and calling `.serializers`
// throws an error)
class CallingSerializersThrewError extends Error {}

type SerializerAttribute = DreamSerializerBuilder<any, any, any>['attributes'][number]

interface ReferencedSerializersAndOpenapiSchemaBodyShorthand {
  referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  openapi: OpenapiSchemaBodyShorthand
}

interface ReferencedSerializersAndAttributes {
  referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  attributes: Record<string, OpenapiSchemaBodyShorthand>
}

// root keywords that apply a subschema to the value itself; any of them can
// still reject null after the schema's own `type` admits it
const SUBSCHEMA_APPLICATORS = ['allOf', 'anyOf', 'oneOf', 'not', 'if', '$ref'] as const

function hasSubschemaApplicator(schemaRecord: Record<string, unknown>): boolean {
  return SUBSCHEMA_APPLICATORS.some(keyword => schemaRecord[keyword] !== undefined)
}

function openapiTypeIncludesNull(type: unknown): boolean {
  return type === 'null' || (Array.isArray(type) && type.includes('null'))
}

/**
 * Whether the schema is known to accept null: its `type`, `enum` and `const`
 * all admit null and no subschema applied beside them can reject it, or, with
 * no `type`, a root `anyOf` has a branch that accepts null. A schema this cannot
 * prove accepts null (a `$ref`, for one) answers false.
 */
function openapiSchemaAcceptsNull(schema: OpenapiSchemaBodyShorthand): boolean {
  if (typeof schema !== 'object' || schema === null) return false

  const schemaRecord = schema as Record<string, unknown>

  if (Array.isArray(schemaRecord.enum) && !schemaRecord.enum.includes(null)) return false
  if ('const' in schemaRecord && schemaRecord.const !== null) return false

  if (schemaRecord.type !== undefined)
    return openapiTypeIncludesNull(schemaRecord.type) && !hasSubschemaApplicator(schemaRecord)

  return (
    Array.isArray(schemaRecord.anyOf) &&
    schemaRecord.anyOf.some(member => openapiSchemaAcceptsNull(member as OpenapiSchemaBodyShorthand)) &&
    !hasSubschemaApplicator({ ...schemaRecord, anyOf: undefined })
  )
}

/**
 * Widens a schema to also accept null. When its `type`, `enum` and `const` are
 * the only keywords that can reject null, null is added to each in place
 * (a `const` becomes an `enum` of its value and null), matching how a nullable
 * enum column renders. Otherwise (no `type`, a subschema applied beside it, or
 * both an `enum` and a `const`) the result is `anyOf` the schema or null.
 */
function openapiSchemaWithNull(schema: OpenapiSchemaBodyShorthand): OpenapiSchemaBodyShorthand {
  const schemaRecord = schema as Record<string, unknown>
  const { type } = schemaRecord
  const hasConst = 'const' in schemaRecord

  if (
    type === undefined ||
    hasSubschemaApplicator(schemaRecord) ||
    (hasConst && schemaRecord.enum !== undefined)
  )
    return { anyOf: [schema, NULL_OBJECT_OPENAPI] }

  const { const: constValue, ...schemaWithoutConst } = schemaRecord
  const types = Array.isArray(type) ? (type as unknown[]) : [type]
  const allowedValues = hasConst ? [constValue] : schemaRecord.enum

  return {
    ...schemaWithoutConst,
    type: openapiTypeIncludesNull(type) ? type : [...types, 'null'],
    ...(Array.isArray(allowedValues)
      ? { enum: allowedValues.includes(null) ? allowedValues : [...(allowedValues as unknown[]), null] }
      : {}),
  } as OpenapiSchemaBodyShorthand
}

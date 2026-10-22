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
import serializersAndRefsFromSerializableRef from './helpers/serializersAndRefsFromSerializableRef.js'
const NULL_OBJECT_OPENAPI: OpenapiSchemaBody = { type: 'null' }

export default class SerializerOpenapiRenderer {
  private casing: SerializerCasing
  private suppressResponseEnums: boolean
  private enumCollector: OpenapiEnumCollector | undefined
  private allOfSiblings: OpenapiSchemaBodyShorthand[] = []

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

    if (this.allOfSiblings.length) {
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
          allOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, ...this.allOfSiblings],
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
        required: sort(uniq(requiredProperties.map(property => this.setCase(property)))),
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

    renderedOpenapi = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
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
              this.allOfSiblings.push(this.flattenedCustomAttributeOpenapi(attribute, openapi))
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
                this.allOfSiblings.push(
                  this.flattenedOpenapi(attribute, flattenedAssociationShape(serializers, optional)),
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
   * The `allOf` sibling for a customAttribute with `flatten: true`
   */
  private flattenedCustomAttributeOpenapi(
    attribute: SerializerAttribute,
    openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  ): OpenapiSchemaBodyShorthand {
    const serializerRef = openapi as Partial<
      OpenapiSchemaShorthandExpressionSerializerRef & OpenapiSchemaShorthandExpressionSerializableRef
    >
    if (!isObject(openapi) || !(serializerRef.$serializer || serializerRef.$serializable))
      return this.flattenedOpenapi(attribute, openapi)

    const { many, maybeNull, ...singleSerializerRef } = serializerRef

    // flattening an array would spread its indexes into this object, so a
    // flattened `many` has no faithful shape; it renders the ref(s) alone, as
    // it did before `many` was expanded
    if (many) return allSerializersToRefsInOpenapi(singleSerializerRef as OpenapiSchemaBodyShorthand)

    return this.flattenedOpenapi(
      attribute,
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
   * Flattening spreads the nested value's fields into this object, so the
   * rendered value is never null itself, and an `anyOf [ref, { type: 'null' }]`
   * sibling can never match it. Dream renders every key a shape requires
   * whichever shape it renders, so:
   * - a null value (a null association, or a callback returning null) renders
   *   each key `shape` requires as null, so `{ type: 'null' }` becomes an
   *   object whose properties, when present, are null;
   * - of several shapes (the children of an STI base, the targets of a
   *   polymorphic BelongsTo, the members of an `anyOf` or `oneOf`), the
   *   rendered one renders beside the keys the other shapes require, as null;
   * - a plain object a callback returns renders as null each key its shape
   *   requires that it leaves out, so those keys' schemas accept null (see
   *   `flattenedShapeSchema`).
   * Listing those keys also lets the `allOf` wrapper's
   * `unevaluatedProperties: false` accept them. Dream computes them
   * (`DreamApp.system.nullFlattenedOpenapiKeys` and
   * `nullFlattenedOpenapiKeysOfOtherVariants`, the walk its renderer uses), so
   * the document cannot drift from what it renders.
   */
  private flattenedOpenapi(
    attribute: SerializerAttribute,
    shape: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  ): OpenapiSchemaBodyShorthand {
    const variants = flattenedOpenapiVariants(shape)
    if (variants.length < 2) return this.flattenedVariantOpenapi(attribute, shape, shape, {})

    return {
      anyOf: variants.map(variant =>
        this.flattenedVariantOpenapi(
          attribute,
          shape,
          variant,
          DreamApp.system.nullFlattenedOpenapiKeysOfOtherVariants(shape, variant, this.nullKeysOptions),
        ),
      ),
    } as OpenapiSchemaBodyShorthand
  }

  /**
   * @internal
   *
   * One branch of a flattened sibling (see `flattenedOpenapi`): the schema of
   * `variant`, one shape of `shape`, combined with `filledKeys`, the keys Dream
   * renders as null beside it. For the `{ type: 'null' }` variant, an object
   * whose properties, the keys `shape` requires, are null when present.
   */
  private flattenedVariantOpenapi(
    attribute: SerializerAttribute,
    shape: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    variant: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    filledKeys: Record<string, null>,
  ): OpenapiSchemaBodyShorthand {
    if (isNullSchema(variant)) {
      return (
        this.nullKeysOpenapi(
          attribute,
          shape,
          DreamApp.system.nullFlattenedOpenapiKeys(shape, this.nullKeysOptions),
        ) ?? ({ type: 'object', properties: {} } as OpenapiSchemaBodyShorthand)
      )
    }

    const schema = this.flattenedShapeSchema(
      allSerializersToRefsInOpenapi(openapiShorthandToOpenapi(variant)),
      [],
    )
    const filled = this.nullKeysOpenapi(attribute, shape, filledKeys)
    return filled ? ({ allOf: [schema, filled] } as OpenapiSchemaBodyShorthand) : schema
  }

  /**
   * @internal
   *
   * An object whose properties, when present, are null: `keys`, keys Dream
   * renders as null for a flattened attribute whose value's shape is `shape`,
   * less any key another attribute of this serializer declares. Undefined when
   * no key remains.
   *
   * A key two attributes render holds whichever value was rendered last, so
   * Dream's null for it is overwritten by, or overwrites, the other attribute's
   * value, depending on which is declared later. The other attribute's schema
   * describes the key, and listing it as null here would contradict that
   * schema, rejecting the payload and making fast-json-stringify fail to
   * compile. A flattened attribute declares every key its own shape declares,
   * required or not, which Dream reads for it (`nullFlattenedOpenapiKeysOfOtherVariants`
   * keeps the keys `shape` requires that the other shape does not declare).
   */
  private nullKeysOpenapi(
    attribute: SerializerAttribute,
    shape: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    keys: Record<string, null>,
  ): OpenapiSchemaBodyShorthand | undefined {
    let remaining = Object.keys(keys)

    for (const otherAttribute of this.serializerBuilder['attributes']) {
      if (otherAttribute === attribute || !remaining.length) continue

      const otherShape = this.flattenedShape(otherAttribute)

      if (otherShape === undefined) {
        const otherKey = this.setCase(attributeOutputName(otherAttribute))
        remaining = remaining.filter(key => key !== otherKey)
        //
      } else if (otherShape !== null) {
        const notDeclaredByOther = DreamApp.system.nullFlattenedOpenapiKeysOfOtherVariants(
          shape,
          otherShape,
          this.nullKeysOptions,
        )
        remaining = remaining.filter(key => Object.prototype.hasOwnProperty.call(notDeclaredByOther, key))
      }
    }

    if (!remaining.length) return undefined

    return {
      type: 'object',
      properties: Object.fromEntries(sort(remaining).map(key => [key, NULL_OBJECT_OPENAPI])),
    } as OpenapiSchemaBodyShorthand
  }

  /**
   * @internal
   *
   * The openapi shorthand of the value a flattened attribute spreads into this
   * object (see `flattenedOpenapi`): undefined for an attribute that is not
   * flattened, and null for a flattened rendersOne whose serializers cannot be
   * resolved (the rendersOne case of renderedOpenapiAttributes renders a
   * placeholder for it), which declares no key.
   */
  private flattenedShape(
    attribute: SerializerAttribute,
  ): OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | null | undefined {
    switch (attribute.type) {
      case 'customAttribute':
        return attribute.options.flatten ? attribute.options.openapi : undefined

      case 'rendersOne': {
        if (!attribute.options.flatten) return undefined

        try {
          const { optional, serializers } = associationSerializers(
            attribute,
            this.serializerBuilder['$typeForOpenapi'] as typeof Dream | ViewModelClass | undefined,
          )
          return flattenedAssociationShape(serializers, optional)
        } catch (error) {
          if (error instanceof CallingSerializersThrewError) return null
          throw error
        }
      }

      default:
        return undefined
    }
  }

  /**
   * @internal
   *
   * A hand-written shape as a flattened customAttribute spreads it: its
   * `properties` keys and `required` names cased as this serializer's keys are
   * (Dream cases a flattened plain object's keys with the render), and the
   * schema of each key the shape requires widened to accept null, since Dream
   * renders as null a required key the callback's object leaves out. A shape's
   * `required` array also requires a key a member of its `allOf`, `anyOf` or
   * `oneOf` declares, as Dream reads it. A `$ref` is a serializer's, which
   * renders every key it declares, so it is left as is, and so is a property's
   * own schema: a nested value renders as returned.
   */
  private flattenedShapeSchema(
    schema: OpenapiSchemaBodyShorthand,
    inheritedRequired: string[],
  ): OpenapiSchemaBodyShorthand {
    if (!isObject(schema)) return schema

    const schemaRecord = schema as Record<string, any>
    if (schemaRecord.$ref) return schema

    const ownRequired: string[] = Array.isArray(schemaRecord.required) ? schemaRecord.required : []
    const required = [...inheritedRequired, ...ownRequired]
    const flattened: Record<string, any> = { ...schemaRecord }

    if (isObject(schemaRecord.properties)) {
      flattened.properties = Object.fromEntries(
        Object.entries(schemaRecord.properties as Record<string, any>).map(([key, property]) => [
          this.setCase(key),
          required.includes(key) ? openapiPropertyWithNull(property) : property,
        ]),
      )
    }

    if (Array.isArray(schemaRecord.required)) flattened.required = ownRequired.map(key => this.setCase(key))

    for (const combinator of ['allOf', 'anyOf', 'oneOf'] as const) {
      if (Array.isArray(schemaRecord[combinator]))
        flattened[combinator] = (schemaRecord[combinator] as OpenapiSchemaBodyShorthand[]).map(member =>
          this.flattenedShapeSchema(member, required),
        )
    }

    return flattened as OpenapiSchemaBodyShorthand
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

// The shapes a flattened value may take, each one Dream renders in place of the
// others, with the keys they require as null beside it: a `$serializer` ref to
// each serializer a `$serializable` ref resolves to (one per child of an STI
// base), or the members of an `anyOf` or `oneOf`, where a member with several
// shapes of its own (a nested `anyOf` or `oneOf`, or a `$serializable` ref to
// an STI base) contributes those in its place, and an `allOf` beside the
// `anyOf` or `oneOf`, which describes every value, joins each of them. A `many`
// ref has none: a list has no keys to spread. Any other shape is the one shape
// its value takes.
// This mirrors how Dream's renderer reads the shapes a flattened
// customAttribute's value may take (`openapiVariants` in
// `src/serializer/helpers/nullFlattenedSerializerKeys.ts`), which Dream does
// not export.
function flattenedOpenapiVariants(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
): OpenapiSchemaBodyShorthand[] {
  if (!isObject(openapi)) return []
  const schema = openapi as Record<string, any>

  if (schema.$serializable) {
    if (schema.many) return []
    return serializersAndRefsFromSerializableRef(
      schema as OpenapiSchemaShorthandExpressionSerializableRef,
    ).serializers.map(serializer => ({ $serializer: serializer }) as OpenapiSchemaBodyShorthand)
  }

  const members: OpenapiSchemaBodyShorthand[] = [
    ...(Array.isArray(schema.anyOf) ? (schema.anyOf as OpenapiSchemaBodyShorthand[]) : []),
    ...(Array.isArray(schema.oneOf) ? (schema.oneOf as OpenapiSchemaBodyShorthand[]) : []),
  ]
  const variants = members.flatMap(member => {
    const memberVariants = flattenedOpenapiVariants(member)
    return memberVariants.length > 1 ? memberVariants : [member]
  })

  const sharedMembers: OpenapiSchemaBodyShorthand[] = Array.isArray(schema.allOf) ? schema.allOf : []
  return sharedMembers.length
    ? variants.map(variant => ({ allOf: [...sharedMembers, variant] }) as OpenapiSchemaBodyShorthand)
    : variants
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

// a hand-written property's schema, shorthand or not, widened to accept null
function openapiPropertyWithNull(property: unknown): unknown {
  if (typeof property === 'string') return property === 'null' ? property : [property, 'null']
  if (Array.isArray(property)) return property // a `[<shorthand>, 'null']` tuple already accepts null
  if (!isObject(property)) return property
  const schema = property as OpenapiSchemaBodyShorthand
  return openapiSchemaAcceptsNull(schema) ? schema : openapiSchemaWithNull(schema)
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

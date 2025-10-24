/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dream } from '@rvoh/dream'
import {
  DreamSerializerBuilder,
  expandStiClasses,
  inferSerializersFromDreamClassOrViewModelClass,
  isDreamSerializer,
} from '@rvoh/dream/internal'
import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionRef,
} from '@rvoh/dream/openapi'
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
import allSerializersFromHandWrittenOpenapi from './helpers/allSerializersFromHandWrittenOpenapi.js'
import allSerializersToRefsInOpenapi from './helpers/allSerializersToRefsInOpenapi.js'
import { dreamColumnOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'
import openapiShorthandToOpenapi from './helpers/openapiShorthandToOpenapi.js'
const NULL_OBJECT_OPENAPI: OpenapiSchemaBody = { type: 'null' }

export default class SerializerOpenapiRenderer {
  private casing: SerializerCasing
  private suppressResponseEnums: boolean
  private allOfSiblings: OpenapiSchemaBodyShorthand[] = []

  constructor(
    private serializer: DreamModelSerializerType | SimpleObjectSerializerType,
    {
      casing = 'camel',
      suppressResponseEnums = false,
    }: {
      casing?: SerializerCasing
      suppressResponseEnums?: boolean
    } = {},
  ) {
    if (!isDreamSerializer(this.serializer))
      throw new NonSerializerPassedToSerializerOpenapiRenderer(this.serializer)
    this.casing = casing
    this.suppressResponseEnums = suppressResponseEnums
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
      const openapi = referencedSerializersAndOpenapiSchemaBodyShorthand.openapi

      return {
        ...referencedSerializersAndOpenapiSchemaBodyShorthand,
        openapi: {
          allOf: [openapi, ...this.allOfSiblings],
        },
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
              this.allOfSiblings.push(
                allSerializersToRefsInOpenapi(openapiShorthandToOpenapi(openapi as any)),
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

            if (attributeType === 'delegatedAttribute' && (DataTypeForOpenapi as typeof Dream)?.isDream) {
              const source = DataTypeForOpenapi as typeof Dream
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              const associatedModelOrModels = source['getAssociationMetadata'](
                attribute.targetName,
              )?.modelCB()
              target = Array.isArray(associatedModelOrModels)
                ? associatedModelOrModels[0]
                : associatedModelOrModels
            } else if (attributeType === 'delegatedAttribute') {
              target = undefined
            } else {
              target = DataTypeForOpenapi
            }

            accumulator[outputAttributeName] = allSerializersToRefsInOpenapi(
              (target as typeof Dream)?.isDream
                ? dreamColumnOpenapiShape(target as typeof Dream, attribute.name, openapi, {
                    suppressResponseEnums: this.suppressResponseEnums,
                  })
                : openapiShorthandToOpenapi(openapi as any),
            )

            return accumulator
          }
          /////////////////////////////////////////////
          // end:attributes and delegated attributes //
          /////////////////////////////////////////////

          //////////////////
          // rendersOnes  //
          //////////////////
          case 'rendersOne': {
            try {
              const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
              const { associationOpts, referencedSerializersAndOpenapiSchemaBodyShorthand } =
                associationOpenapi(attribute, DataTypeForOpenapi, alreadyExtractedDescendantSerializers)
              const optional = attribute.options.optional ?? associationOpts.optional

              newlyReferencedSerializers =
                referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers

              if (attribute.options.flatten && optional) {
                this.allOfSiblings.push({
                  anyOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, NULL_OBJECT_OPENAPI],
                })
                //
              } else if (attribute.options.flatten) {
                this.allOfSiblings.push(referencedSerializersAndOpenapiSchemaBodyShorthand.openapi)
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
              if (error instanceof CallingSerializersThrewError) return accumulator
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
            try {
              const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
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
              if (error instanceof CallingSerializersThrewError) return accumulator
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

    return {
      referencedSerializers: uniq(referencedSerializers, serializer => (serializer as any).globalName),
      attributes: renderedOpenapi,
    }
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
  referencedSerializersAndOpenapiSchemaBodyShorthand: ReferencedSerializersAndOpenapiSchemaBodyShorthand
} {
  const serializerOverride = attribute.options.serializer
  if (serializerOverride) {
    try {
      return {
        associationOpts: { optional: false },
        referencedSerializersAndOpenapiSchemaBodyShorthand: {
          referencedSerializers: [
            serializerOverride,
            ...descendantSerializers(serializerOverride, alreadyExtractedDescendantSerializers),
          ],
          openapi: new SerializerOpenapiRenderer(serializerOverride).serializerRef,
        },
      }
    } catch (error) {
      if (error instanceof NonSerializerPassedToSerializerOpenapiRenderer)
        throw new NonSerializerSerializerOverrideProvided(attribute, serializerOverride)
      throw error
    }
  }

  let associatedClasses: (typeof Dream | ViewModelClass)[]
  const association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | undefined =
    (DataTypeForOpenapi as typeof Dream)?.isDream &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (DataTypeForOpenapi as typeof Dream)['getAssociationMetadata'](attribute.name)
  const optional: boolean = !!(association as BelongsToStatement<any, any, any, any>)?.optional

  if (association) {
    associatedClasses = expandStiClasses(association.modelCB())
    //
  } else {
    const associatedClass: typeof Dream | ViewModelClass | undefined =
      attribute.options.dreamClass ?? attribute.options.viewModelClass

    if (associatedClass === undefined) {
      let serializerCheck: DreamModelSerializerType | SimpleObjectSerializerType | undefined

      try {
        ;(DataTypeForOpenapi as ViewModelClass)?.prototype?.serializers
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
      inferSerializersFromDreamClassOrViewModelClass(associatedClass, attribute.options.serializerKey),
    ),
  )

  if (serializers.length === 0) throw new NoSerializerFoundForRendersOneAndMany(attribute.name)
  if (serializers.length === 1) {
    const serializer = serializers[0]!
    return {
      associationOpts: { optional },
      referencedSerializersAndOpenapiSchemaBodyShorthand: {
        referencedSerializers: [
          serializer,
          ...descendantSerializers(serializer, alreadyExtractedDescendantSerializers),
        ],
        openapi: new SerializerOpenapiRenderer(serializer).serializerRef,
      },
    }
  }

  return {
    associationOpts: { optional },
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

function descendantSerializers(
  serializer: DreamModelSerializerType | SimpleObjectSerializerType,
  alreadyExtractedDescendantSerializers: Record<string, boolean>,
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  // alreadyExtractedDescendantSerializers is used not only to avoid duplicate
  // work (and thereby speed up OpenAPI spec generation), but also to avoid
  // infinite loops (a recursive OpenAPI structure is valid)
  if (alreadyExtractedDescendantSerializers[(serializer as any).globalName]) return []

  if (!isDreamSerializer(serializer))
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

interface ReferencedSerializersAndOpenapiSchemaBodyShorthand {
  referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  openapi: OpenapiSchemaBodyShorthand
}

interface ReferencedSerializersAndAttributes {
  referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  attributes: Record<string, OpenapiSchemaBodyShorthand>
}

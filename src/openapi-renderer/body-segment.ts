import { Dream, DreamApp } from '@rvoh/dream'
import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaExpressionRefSchemaShorthand,
  OpenapiSchemaShorthandExpressionSerializableRef,
  OpenapiSchemaShorthandExpressionSerializerRef,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import { DreamModelSerializerType, SerializerCasing, SimpleObjectSerializerType } from '@rvoh/dream/types'
import NonSerializerSuppliedToSerializerBodySegment from '../error/openapi/NonSerializerSuppliedToSerializerBodySegment.js'
import { OpenapiEndpointResponse, OpenapiRenderOpts, OpenapiResponses } from './endpoint.js'
import buildDreamRequestBodyShape from './helpers/buildDreamRequestBodyShape.js'
import OpenapiEnumCollector from './helpers/OpenapiEnumCollector.js'
import schemaToRef from './helpers/schemaToRef.js'
import serializerRefsToOpenapi from './helpers/serializerRefsToOpenapi.js'
import serializersAndRefsFromSerializableRef from './helpers/serializersAndRefsFromSerializableRef.js'
import SerializerOpenapiRenderer from './SerializerOpenapiRenderer.js'

export interface OpenapiBodySegmentRendererOpts {
  renderOpts: OpenapiRenderOpts
  target: OpenapiBodyTarget
  /**
   * Identifier (typically a controller-action path) used to enrich error
   * messages emitted by `dreamColumnOpenapiShape` when an unrecognized DB
   * type is encountered while expanding a `$dream` sentinel. Optional —
   * defaults to `'unknown'` when not supplied.
   */
  source?: string
}

type OpenapiSegmentExpand = (bodySegment: OpenapiBodySegment) => OpenapiSchemaBody

/**
 * @internal
 *
 * Internal class used to recursively expand OpenAPI shorthand notation into full OpenAPI schema objects.
 *
 * This class handles the transformation of various shorthand formats:
 * - Primitive shorthands like `'string'` → `{ type: 'string' }`
 * - Nullable shorthands like `['string', 'null']` → `{ type: ['string', 'null'] }`
 * - Array shorthands like `'string[]'` → `{ type: 'array', items: { type: 'string' } }`
 * - Nullable array shorthands like `['string[]', 'null']` → `{ type: ['array', 'null'], items: { type: 'string' } }`
 * - Serializer references like `{ $serializer: SomeSerializer }` → `{ $ref: '#/components/schemas/SerializerOpenapiName' }`
 * - Serializable references like `{ $serializable: SomeModel, key: 'summary' }` → resolved serializer reference
 * - Nested model-derived request-body references like `{ for: SomeModel, params, including, required, combining }` → an inline object schema derived from the model's param-safe columns (request-only)
 *
 * Dream's shorthand expansion (`DreamApp.system.expandOpenapiShorthand`) walks
 * the shape, at any depth, and expands every node but the references, which it
 * hands back to this class: `$serializer`, `$serializable`, `for:`, `$ref` and
 * `$schema`. So the shapes models declare (`@deco.JSON`, `@deco.Virtual`,
 * `@deco.Encrypted`), which contain no reference, and every shape Psychic
 * renders are expanded by one expansion. This class keeps the collection of
 * referenced serializers that need to be included in the final OpenAPI
 * document.
 *
 * @example
 * ```typescript
 * // Input shorthand
 * {
 *   type: 'object',
 *   properties: {
 *     name: 'string',
 *     tags: 'string[]',
 *     user: { $serializer: UserSerializer }
 *   }
 * }
 *
 * // Output expanded
 * {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     tags: { type: 'array', items: { type: 'string' } },
 *     user: { $ref: '#/components/schemas/UserSerializer' }
 *   }
 * }
 * ```
 */
export default class OpenapiSegmentExpander {
  private bodySegment: OpenapiBodySegment
  private casing: SerializerCasing
  private suppressResponseEnums: boolean
  private legacyImplicitRequestBodyParams: boolean
  private enumCollector: OpenapiEnumCollector | undefined
  private target: OpenapiBodyTarget
  private source: string

  /**
   * @internal
   *
   * Used to recursively expand nested object structures
   * within nested openapi objects
   */
  constructor(
    bodySegment: OpenapiBodySegment,
    { renderOpts, target, source }: OpenapiBodySegmentRendererOpts,
  ) {
    this.bodySegment = bodySegment
    this.casing = renderOpts.casing
    this.suppressResponseEnums = renderOpts.suppressResponseEnums
    this.legacyImplicitRequestBodyParams = renderOpts.legacyImplicitRequestBodyParams
    this.enumCollector = renderOpts.enumCollector
    this.target = target
    this.source = source ?? 'unknown'
  }

  /**
   * returns the shorthanded body segment, rendered
   * to the appropriate openapi shape
   */
  public render(): ReferencedSerializersAndOpenapiSchemaBody {
    const referencedSerializers: SerializerArray = []

    const openapi = DreamApp.system.expandOpenapiShorthand(this.bodySegment, {
      expandReference: (node, expand) => this.referenceStatement(node, expand, referencedSerializers),
      // a nullable string enum keeps its enum
      suppressEnums: this.target === 'response' && this.suppressResponseEnums,
    })

    return { referencedSerializers, openapi }
  }

  /**
   * @internal
   *
   * Expands a reference node, collecting the serializers it references, or
   * returns `undefined` for any other node, which Dream's expansion expands.
   */
  private referenceStatement(
    node: object,
    expand: OpenapiSegmentExpand,
    referencedSerializers: SerializerArray,
  ): OpenapiSchemaBody | undefined {
    const serializerRefBodySegment = node as OpenapiSchemaShorthandExpressionSerializerRef
    const serializableRefBodySegment = node as OpenapiSchemaShorthandExpressionSerializableRef
    const refBodySegment = node as OpenapiSchemaExpressionRef
    const schemaRefBodySegment = node as OpenapiSchemaExpressionRefSchemaShorthand

    if (typeof serializerRefBodySegment.$serializer === 'function')
      return this.serializerStatement(serializerRefBodySegment, referencedSerializers)
    if (serializableRefBodySegment.$serializable)
      return this.serializableStatement(serializableRefBodySegment, referencedSerializers)
    if (typeof (node as { for?: unknown }).for === 'function') return this.forStatement(node, expand)
    if (refBodySegment.$ref) return this.refStatement(refBodySegment)
    if (schemaRefBodySegment.$schema) return schemaToRef(schemaRefBodySegment)
    return undefined
  }

  /**
   * @internal
   *
   * recursively a $ref statement
   */
  private refStatement(refBodySegment: OpenapiSchemaExpressionRef): OpenapiSchemaExpressionRef {
    return {
      $ref: `#/${refBodySegment.$ref.replace(/^#\//, '')}`,
    }
  }

  /**
   * @internal
   *
   * recursively a $ref statement
   */
  private serializerStatement(
    serializerRefBodySegment: OpenapiSchemaShorthandExpressionSerializerRef,
    referencedSerializers: SerializerArray,
  ): OpenapiSchemaBody {
    const serializer = serializerRefBodySegment.$serializer

    if (!DreamApp.system.isDreamSerializer(serializer))
      throw new NonSerializerSuppliedToSerializerBodySegment(this.bodySegment, serializer)

    const serializerRef = new SerializerOpenapiRenderer(serializer, {
      casing: this.casing,
      suppressResponseEnums: this.suppressResponseEnums,
      enumCollector: this.enumCollector,
    }).serializerRef

    referencedSerializers.push(serializer)
    return serializerRefsToOpenapi([serializerRef], serializerRefBodySegment)
  }

  /**
   * @internal
   *
   * Expand a nested `for:` request-body sentinel into a fully-resolved
   * `OpenapiSchemaObject`. The sentinel takes the same shape as the
   * top-level model-driven `requestBody`:
   *
   * ```ts
   * { for: SomeModel, including?, only?, required?, combining? }
   * ```
   *
   * and produces the same shape that the top-level model-driven
   * `requestBody` produces — param-safe columns inferred from the model,
   * with `combining` entries (which themselves may contain further `for:`
   * sentinels) merged into the resulting properties.
   *
   * The `for:` sentinel is request-only at the type level. If it is
   * encountered while expanding a response shape, this method throws —
   * the type system should have prevented this, so reaching here indicates
   * a misuse that bypassed type checking (e.g., via `as any`).
   */
  private forStatement(bodySegment: object, expand: OpenapiSegmentExpand): OpenapiSchemaBody {
    if (this.target !== 'request') {
      throw new Error(
        `'for:' sentinel is only valid inside request body shorthand; encountered while expanding a response.`,
      )
    }

    const ref = bodySegment as unknown as {
      for: typeof Dream
      params?: readonly string[]
      including?: readonly string[]
      only?: readonly string[]
      required?: readonly string[]
      combining?: Record<string, unknown>
    }

    const paramsShape = buildDreamRequestBodyShape(
      ref.for,
      {
        params: ref.params,
        only: ref.only,
        including: ref.including,
        required: ref.required,
        combining: ref.combining,
        legacyImplicitRequestBodyParams: this.legacyImplicitRequestBodyParams,
        enumCollector: this.enumCollector,
      },
      this.source,
    )

    return expand(paramsShape)
  }

  private serializableStatement(
    serializableRef: OpenapiSchemaShorthandExpressionSerializableRef,
    referencedSerializers: SerializerArray,
  ): OpenapiSchemaBody {
    const key = serializableRef.$serializableSerializerKey || serializableRef.key || 'default'
    const { serializers, refs } = serializersAndRefsFromSerializableRef(serializableRef, {
      casing: this.casing,
      suppressResponseEnums: this.suppressResponseEnums,
      enumCollector: this.enumCollector,
    })

    if (serializers.length === 0)
      throw new Error(
        `Failed to locate serializers getter from: ${serializableRef.$serializable.name} using key: ${key}`,
      )

    if (serializers.length === 1) {
      return this.serializerStatement(
        {
          $serializer: serializers[0]!,
          ...serializableRef,
        } as OpenapiSchemaShorthandExpressionSerializerRef,
        referencedSerializers,
      )
    }

    referencedSerializers.push(...serializers)
    return serializerRefsToOpenapi(refs, serializableRef)
  }
}

export type OpenapiBodySegment =
  | OpenapiSchemaBodyShorthand
  | OpenapiShorthandPrimitiveTypes
  | { description: string }
  | undefined

export type OpenapiBodyTarget = 'request' | 'response'

export type SerializerArray = (DreamModelSerializerType | SimpleObjectSerializerType)[]

export interface ReferencedSerializersAndOpenapiSchemaBody {
  referencedSerializers: SerializerArray
  openapi: OpenapiSchemaBody
}

export interface ReferencedSerializersAndOpenapiResponses {
  referencedSerializers: SerializerArray
  openapi: OpenapiResponses
}

export interface ReferencedSerializersAndOpenapiEndpointResponse {
  referencedSerializers: SerializerArray
  openapi: OpenapiEndpointResponse
}

import { OpenapiSchemaArray } from '@rvoh/dream/openapi'
import OpenapiRequestValidationFailure from '../../error/openapi/OpenapiRequestValidationFailure.js'
import OpenapiResponseValidationFailure from '../../error/openapi/OpenapResponseValidationFailure.js'
import validateOpenApiSchema, { ValidateOpenapiSchemaOptions } from '../../helpers/validateOpenApiSchema.js'
import PsychicApp from '../../psychic-app/index.js'
import OpenapiEndpointRenderer, {
  OpenapiContent,
  OpenapiParameterResponse,
  OpenapiRenderOpts,
  OpenapiValidateTarget,
} from '../endpoint.js'
import suppressResponseEnumsConfig from './suppressResponseEnumsConfig.js'

/**
 * @internal
 *
 * Used to validate specific parts of a request, such
 * as the body or headers, as well as the response body.
 */
export default class OpenapiPayloadValidator {
  constructor(
    /**
     * the openapiName to validate against
     */
    private openapiName: string,

    /**
     * the OpenapiEndpointRenderer attached to the controller
     * for this particular action
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private openapiEndpointRenderer: OpenapiEndpointRenderer<any, any>,
  ) {}

  /**
   * @internal
   *
   * validates the provided request body against the request body
   * shape specified by the openapi decorator. Will bypass validation
   * unless validation is explicitly activated for requestBody at
   * either the OpenAPI decorator level, or else the openapi config
   * for the provided openapiName.
   *
   * @param body - the request body
   */
  public validateOpenapiRequestBody(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
  ): void {
    const openapiEndpointRenderer = this.openapiEndpointRenderer
    const openapiName = this.openapiName
    const routes = PsychicApp.getOrFail().routesCache

    if (openapiEndpointRenderer.shouldValidateRequestBody(openapiName)) {
      const openapiPathObject = openapiEndpointRenderer['computedRequestBody'](routes, {
        openapiName,
        renderOpts: this.renderOpts,
      })

      const requestBodySchema = openapiPathObject?.['content']?.['application/json']?.['schema']
      if (requestBodySchema) {
        this.validateOrFail(body, requestBodySchema, 'requestBody')
      }
    }
  }

  /**
   * @internal
   *
   * validates the provided request headers against the header
   * shape specified by the openapi decorator. Will bypass validation
   * unless validation is explicitly activated for headers at
   * either the OpenAPI decorator level, or else the openapi config
   * for the provided openapiName.
   *
   * @param headers - the request headers
   */
  public validateOpenapiHeaders(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headers: any,
  ): void {
    const openapiEndpointRenderer = this.openapiEndpointRenderer
    const openapiName = this.openapiName

    if (openapiEndpointRenderer.shouldValidateHeaders(openapiName)) {
      const headerSchemas = openapiEndpointRenderer['headersArray']({
        openapiName,
      })

      const camelizedHeaders = this.camelizedOpenapiHeaders(headers, headerSchemas)
      this.validateOrFail(
        camelizedHeaders,
        this.openapiParameterResponsesToSchemaObject(headerSchemas),
        'headers',
      )
    }
  }

  /**
   * @internal
   *
   * validates the provided request headers against the header
   * shape specified by the openapi decorator. Will bypass validation
   * unless validation is explicitly activated for headers at
   * either the OpenAPI decorator level, or else the openapi config
   * for the provided openapiName.
   *
   * @param query - the request query params
   */
  public validateOpenapiQuery<T>(query: T): void {
    const openapiEndpointRenderer = this.openapiEndpointRenderer
    const openapiName = this.openapiName

    if (openapiEndpointRenderer.shouldValidateQuery(openapiName)) {
      const openapiQueryParams = openapiEndpointRenderer['queryArray']({
        openapiName,
        renderOpts: this.renderOpts,
      })

      this.conformQueryArrayParamsToOpenapiShape(query, openapiQueryParams)

      this.validateOrFail(query, this.openapiParameterResponsesToSchemaObject(openapiQueryParams), 'query')
    }
  }

  /**
   * transforms the provided query when it detects an openapi
   * schema that desires an array, but is receiving
   * only a single query parameter. i.e. calling the following:
   *
   * ```ts
   * conformQueryArrayParamsToOpenapiShape(
   *   { int: 123, arr: 456 },
   *   {
   *     type: 'object',
   *     properties: {
   *       int: { type: 'integer' },
   *       arr: { type: 'array', items: { type: 'string' }}
   *     }
   *   }
   * )
   * // { int: 123, arr: ['456'] }
   * ```
   *
   * @param query - the provided query payload
   * @param queryOpenapiParameterResponses - the computed openapi parameter responses for this endpoint
   * @returns void
   */
  private conformQueryArrayParamsToOpenapiShape<T>(
    query: T,
    queryOpenapiParameterResponses: OpenapiParameterResponse[],
  ): void {
    queryOpenapiParameterResponses.forEach(parameterResponse => {
      const schemaType = (parameterResponse.schema as OpenapiSchemaArray).type
      const isArray = schemaType === 'array' || (Array.isArray(schemaType) && schemaType.includes('array'))

      if (isArray) {
        const val = query[parameterResponse.name as keyof typeof query]

        if (val === '') {
          query[parameterResponse.name as keyof typeof query] = [] as T[keyof T]
        } else if (val !== undefined && !Array.isArray(val)) {
          query[parameterResponse.name as keyof typeof query] = [val] as T[keyof T]
        }
      }
    })
  }

  /**
   * @internal
   *
   * validates the rendered response body against the response
   * shape specified by the openapi decorator. Will bypass validation
   * unless validation is explicitly activated for responseBody at
   * either the OpenAPI decorator level, or else the openapi config
   * for the provided openapiName.
   *
   * @param data - the response body
   * @param statusCode - the status code used to render
   */
  public validateOpenapiResponseBody(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    statusCode: number,
  ): void {
    const openapiEndpointRenderer = this.openapiEndpointRenderer
    const openapiName = this.openapiName

    if (openapiEndpointRenderer.shouldValidateResponseBody(openapiName)) {
      const openapiResponseBody = openapiEndpointRenderer['parseResponses']({
        openapiName,
        renderOpts: this.renderOpts,
      }).openapi?.[statusCode.toString() as '200'] as OpenapiContent
      const schema = openapiResponseBody?.['content']?.['application/json']?.['schema']

      if (schema) {
        this.validateOrFail(data, schema as object, 'responseBody')
      }
    }
  }

  /**
   * @internal
   *
   * return renderOpts that would be used for this endpoint
   */
  private get renderOpts(): OpenapiRenderOpts {
    return {
      casing: 'camel',
      suppressResponseEnums: suppressResponseEnumsConfig(this.openapiName),
    }
  }

  /**
   * @internal
   *
   * transforms the headerSchemas array provided into an object that can
   * be used to validate against the headers provided in the request
   *
   * @param openapiParams - the array of headers computed by the openapi endpoint renderer
   * @returns the same headers object, but any headers matching those in the openapi schema are camelized
   */
  private openapiParameterResponsesToSchemaObject(
    /**
     * either the headers or query parameters of a request
     */
    openapiParams: OpenapiParameterResponse[],
  ) {
    const properties = openapiParams.reduce(
      (agg, headerSchema) => {
        agg[headerSchema.name] = headerSchema.schema
        return agg
      },
      {} as Record<string, unknown>,
    )

    return {
      type: 'object',
      required: openapiParams.filter(schema => schema.required).map(schema => schema.name),
      properties,
    }
  }

  /**
   * @internal
   *
   * identifies lowercased headers provided by express that match those
   * provided in the headerSchemas, and transforms the found keys to match
   * those in the headerSchemas.
   *
   * @param headers - the headers provided by the request
   * @param headerSchemas - the array of headers computed by the openapi endpoint renderer
   * @returns the same headers object, but any headers matching those in the openapi schema are camelized
   */
  private camelizedOpenapiHeaders(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headers: any,
    headerSchemas: OpenapiParameterResponse[],
  ) {
    const headerSchemaMap = headerSchemas.reduce(
      (agg, schema) => {
        agg[schema.name.toLowerCase()] = schema
        return agg
      },
      {} as Record<string, OpenapiParameterResponse>,
    )

    const camelizedHeaders = Object.keys((headers || {}) as object).reduce(
      (agg, headerKey) => {
        const matchingKey = headerSchemaMap[headerKey]?.name || headerKey

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        agg[matchingKey] = headers[headerKey]

        return agg
      },
      {} as Record<string, unknown>,
    )

    return camelizedHeaders
  }

  /**
   * @internal
   *
   * validates a provided data against the provided openapiSchema.
   * If validation fails, OpenapiValidationFailure will be raised,
   * which is automatically handled by psychic and turned into a 400
   * with the respective errors attached.
   *
   * @param headers - the request headers
   */
  private validateOrFail(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    openapiSchema: object,
    target: OpenapiValidateTarget,
  ) {
    const validationResults = validateOpenApiSchema(
      data || {},
      this.addComponentsToSchema(openapiSchema),
      this.getAjvOptions(target),
    )

    if (!validationResults.isValid) {
      const errorClass =
        target === 'responseBody' ? OpenapiResponseValidationFailure : OpenapiRequestValidationFailure
      throw new errorClass(validationResults.errors || [], target)
    }
  }

  /**
   * @internal
   *
   * Takes a schema and adds all of the missing components
   * that may or may not be needed to evaluate the schema provided.
   * This intervention is necessary, since controller openapi
   * specs can reference schema components that aren't defined
   * within the openapi decorators used in that controller.
   *
   * @param schema - the schema you want components to be added to
   * @returns an object which contains the original schema, as well as the merged components found in the corresponding openapi file
   */
  private addComponentsToSchema<T>(schema: T): T {
    const correspondingOpenapiFileData = PsychicApp.getOrFail().getOpenapiFileOrFail(this.openapiName)

    return {
      ...schema,
      components: correspondingOpenapiFileData?.components,
    }
  }

  /**
   * @internal
   *
   * validates a provided data against the provided openapiSchema.
   * If validation fails, OpenapiValidationFailure will be raised,
   * which is automatically handled by psychic and turned into a 400
   * with the respective errors attached.
   */
  private getAjvOptions(target: OpenapiValidateTarget): ValidateOpenapiSchemaOptions {
    const rendererOpts = this.openapiEndpointRenderer['validate']?.['ajvOptions']
    const openapiConf = PsychicApp.getOrFail().openapi?.[this.openapiName]

    return {
      ...openapiConf?.validate?.ajvOptions,
      ...rendererOpts,

      // if headers or query, we want to levarage ajv type coercion,
      // so that a query or header parameter can have a type of i.e. number
      // or boolean without failing to coerce, since by default our
      // ajv instance will be instantiated with coerceTypes=false
      coerceTypes: target === 'headers' || target === 'query',
    }
  }
}

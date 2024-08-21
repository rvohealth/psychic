import { Dream, DreamSerializer, OpenapiAllTypes, OpenapiFormats, OpenapiSchemaArray, OpenapiSchemaBody, OpenapiSchemaBodyShorthand, OpenapiSchemaExpressionAllOf, OpenapiSchemaExpressionAnyOf, OpenapiSchemaExpressionOneOf, OpenapiSchemaExpressionRef, OpenapiSchemaObject, OpenapiSchemaProperties, SerializableDreamClassOrViewModelClass } from '@rvohealth/dream';
import PsychicController from '../controller';
import { HttpMethod } from '../router/types';
export default class OpenapiEndpointRenderer<DreamsOrSerializersOrViewModels extends SerializableDreamClassOrViewModelClass | SerializableDreamClassOrViewModelClass[] | typeof DreamSerializer | (typeof DreamSerializer)[]> {
    private dreamsOrSerializers;
    private controllerClass;
    private action;
    private many;
    private responses;
    private serializerKey;
    private pathParams;
    private requestBody;
    private headers;
    private query;
    private status;
    private tags;
    private summary;
    private description;
    private nullable;
    private omitDefaultHeaders;
    private omitDefaultResponses;
    private defaultResponse;
    private serializers;
    private computedExtraComponents;
    /**
     * instantiates a new OpenapiEndpointRenderer.
     * This class is used by the `@Openapi` decorator
     * to store information related to a controller's action
     * for use in other parts of the app.
     *
     * the current sole purpose of this renderer is to store
     * endpoint information to use when generating an openapi.json
     * file, which is done using the static:
     * ```ts
     * const openapiJsonContents = await OpenapiEndpointRenderer.buildOpenapiObject()
     * const json = JSON.encode(openapiJsonContents, null, 2)
     * ```
     */
    constructor(dreamsOrSerializers: DreamsOrSerializersOrViewModels | null, controllerClass: typeof PsychicController, action: string, { requestBody, headers, many, query, responses, serializerKey, status, tags, pathParams, description, nullable, summary, omitDefaultHeaders, omitDefaultResponses, defaultResponse, }?: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>);
    /**
     * @internal
     *
     * Each Endpoint renderer contains both path and schema data
     * for the respective endpoint. The OpenapiAppRenderer#toObject method
     * examines each controller, scanning for @OpenAPI decorator calls,
     * each of which instantiates a new OpenapiEndpointRenderer. The
     * OpenapiAppRenderer#toObject will call both `#toPathObject` AND
     * `#toSchemaObject`, combining them both into part of the final
     * Openapi output.
     *
     * `#toPathObject` specifically builds the `paths` portion of the
     * final openapi.json output
     */
    toPathObject(processedSchemas: Record<string, boolean>): Promise<OpenapiEndpointResponse>;
    /**
     * @internal
     *
     * Each Endpoint renderer contains both path and schema data
     * for the respective endpoint. The OpenapiAppRenderer#toObject method
     * examines each controller, scanning for @OpenAPI decorator calls,
     * each of which instantiates a new OpenapiEndpointRenderer. The
     * OpenapiAppRenderer#toObject will call both `#toPathObject` AND
     * `#toSchemaObject`, combining them both into part of the final
     * Openapi output.
     *
     * `#toSchemaObject` specifically builds the `components.schema` portion of the
     * final openapi.json output, adding any relevant entries that were uncovered
     * while parsing the responses and provided callback function.
     */
    toSchemaObject(processedSchemas: Record<string, boolean>): Record<string, OpenapiSchemaBody>;
    /**
     * @internal
     *
     * returns the method that was provided in the options if it is available.
     * Otherwise, it examines the application's routes to determine
     * a controller method match.
     *
     * If no match is found, a guess is taken as to the correct method
     * based on the name of the controller action. If the action is not
     * a standardized crud action, then `get` will be returned.
     */
    private computedMethod;
    private _method;
    /**
     * @internal
     *
     * Generates the path portion of the openapi payload's
     * "parameters" field for a single endpoint.
     */
    private pathParamsArray;
    private _pathParams;
    /**
     * @internal
     *
     * Takes a guess as to the correct method
     * based on the name of the controller action. If the action is not
     * a standardized crud action, then `get` will be returned.
     */
    private guessHttpMethod;
    /**
     * @internal
     *
     * returns the path that was provided in the options if it is available.
     * Otherwise, it examines the application's routes to determine
     * a controller action match.
     *
     * If no match is found, a MissingControllerActionPairingInRoutes exception.
     */
    private computedPath;
    private _path;
    /**
     * @internal
     *
     * find and memoize the route corresponding to this controller.
     * If no match is found, a MissingControllerActionPairingInRoutes exception.
     */
    private getCurrentRouteConfig;
    /**
     * @internal
     *
     * loads all routes for this psychic app and memoizes them
     */
    private _loadRoutes;
    /**
     * @internal
     *
     * Returns the loaded routes (loaded by the #_loadRoutes method)
     */
    private get routes();
    private _routes;
    /**
     * @internal
     *
     * Generates the header portion of the openapi payload's
     * "parameters" field for a single endpoint.
     */
    private headersArray;
    /**
     * @internal
     *
     * Generates the header portion of the openapi payload's
     * "parameters" field for a single endpoint.
     */
    private queryArray;
    /**
     * @internal
     *
     * Generates the requestBody portion of the endpoint
     */
    private computedRequestBody;
    /**
     * @internal
     *
     * determine if the requestBody is meant to identify a special shape
     * used when requestBody is proxying off of the model CB. In these cases,
     * an object with "only" and "required" fields can be passed.
     *
     * This method returns true if it detects that this is the case.
     */
    private shouldAutogenerateBody;
    /**
     * @internal
     *
     * Generates a request body by examining the provided model callback.
     * If the callback returns a single model, then all of the params for
     * that model that are safe to ingest will be automatically added to
     * the request body.
     */
    private generateRequestBodyForModel;
    /**
     * @internal
     *
     * Generates the responses portion of the endpoint
     */
    private parseResponses;
    private applyDefaultResponseOptions;
    /**
     * @internal
     *
     * Returns the default status code that should be used
     * if it was not passed.
     */
    private get defaultStatus();
    /**
     * @internal
     *
     * returns a ref object for the callback passed to the
     * Openapi decorator.
     */
    private parseSerializerResponseShape;
    private accountForNullableOption;
    /**
     * @internal
     *
     * Parses serializer response when @Openapi decorator was called
     * with a non-array entity for the cb return value, i.e.
     *
     * ```ts
     * @Openapi(() => User)
     * public show() {...}
     * ```
     */
    private parseSingleEntitySerializerResponseShape;
    /**
     * @internal
     *
     * Parses serializer response when @Openapi decorator was called
     * with an array entity for the cb return value, i.e.
     *
     * ```ts
     * @Openapi(() => [Comment, Reply])
     * public responses() {...}
     * ```
     */
    private parseMultiEntitySerializerResponseShape;
    /**
     * @internal
     *
     * returns either the delimiter set in the app config, or else a blank string
     * NOTE: this is only public for testing purposes.
     */
    get schemaDelimeter(): string;
    /**
     * @internal
     *
     * recursive function used to parse nested
     * openapi shorthand objects
     */
    private recursivelyParseBody;
    /**
     * @internal
     *
     * Returns the serializer class either attached directly
     * to this OpenapiEndpointRenderer, or else travels through the
     * attached dream or view model to identify a serializer
     * match.
     */
    private getSerializerClasses;
    /**
     * @internal
     *
     * Returns the dream model provided to the callback function.
     * If the callback function does not return a single dream model,
     * then this method will return null.
     */
    private getSingleDreamModelClass;
    /**
     * @internal
     *
     * Uses the provided entity to resolve to a serializer class.
     */
    private getSerializerClass;
}
export declare class MissingControllerActionPairingInRoutes extends Error {
    private controllerClass;
    private action;
    constructor(controllerClass: typeof PsychicController, action: string);
    get message(): string;
}
export interface OpenapiEndpointRendererOpts<T extends SerializableDreamClassOrViewModelClass | SerializableDreamClassOrViewModelClass[] | typeof DreamSerializer | (typeof DreamSerializer)[], NonArrayT extends T extends (infer R extends abstract new (...args: any) => any)[] ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
R & (abstract new (...args: any) => any) : // eslint-disable-next-line @typescript-eslint/no-explicit-any
T & (abstract new (...args: any) => any) = T extends (infer R extends abstract new (...args: any) => any)[] ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
R & (abstract new (...args: any) => any) : // eslint-disable-next-line @typescript-eslint/no-explicit-any
T & (abstract new (...args: any) => any)> {
    many?: boolean;
    pathParams?: OpenapiPathParamOption[];
    headers?: OpenapiHeaderOption[];
    query?: OpenapiQueryOption[];
    requestBody?: OpenapiSchemaBodyShorthand | OpenapiSchemaRequestBodyOnlyOption | null;
    tags?: string[];
    description?: string;
    summary?: string;
    responses?: {
        [statusCode: number]: (OpenapiSchemaBodyShorthand & {
            description?: string;
        }) | {
            description: string;
        };
    };
    defaultResponse?: OpenapiEndpointRendererDefaultResponseOption;
    serializerKey?: InstanceType<NonArrayT> extends {
        serializers: {
            [key: string]: typeof DreamSerializer;
        };
    } ? keyof InstanceType<NonArrayT>['serializers' & keyof InstanceType<NonArrayT>] : undefined;
    status?: number;
    nullable?: boolean;
    omitDefaultHeaders?: boolean;
    omitDefaultResponses?: boolean;
}
export interface OpenapiEndpointRendererDefaultResponseOption {
    description?: string;
}
export interface OpenapiSchemaRequestBodyOnlyOption {
    for?: typeof Dream;
    only?: string[];
    required?: string[];
}
export interface OpenapiHeaderOption {
    name: string;
    required: boolean;
    description?: string;
    format?: 'date' | 'date-time';
}
export interface OpenapiQueryOption {
    name: string;
    required: boolean;
    description?: string;
    allowReserved?: boolean;
    allowEmptyValue?: boolean;
}
export interface OpenapiPathParamOption {
    name: string;
    required: boolean;
    description?: string;
}
export interface OpenapiSchema {
    openapi: `${number}.${number}.${number}`;
    info: {
        version: string;
        title: string;
        description: string;
    };
    paths: OpenapiEndpointResponse;
    components: {
        [key: string]: {
            [key: string]: OpenapiSchemaBody | OpenapiContent;
        };
    };
}
export type OpenapiEndpointResponse = {
    [path: string]: {
        [method in HttpMethod]: OpenapiMethodBody;
    } & {
        parameters: OpenapiParameterResponse[];
    };
};
export interface OpenapiParameterResponse {
    in: OpenapiHeaderType;
    name: string;
    required: boolean;
    description: string;
    schema: {
        type: 'string' | {
            type: 'object';
            properties: OpenapiSchemaProperties;
        };
        format?: 'date' | 'date-time';
    };
    allowReserved?: boolean;
    allowEmptyValue?: boolean;
}
export type OpenapiHeaderType = 'header' | 'body' | 'path' | 'query';
export type OpenapiMethodResponse = {
    [method in HttpMethod]: OpenapiMethodBody;
};
export interface OpenapiMethodBody {
    tags: string[];
    summary: string;
    description: string;
    requestBody: OpenapiContent;
    responses: OpenapiResponses;
}
export interface OpenapiResponses {
    summary?: string;
    description?: string;
    [statusCode: number]: OpenapiContent | OpenapiSchemaExpressionRef | {
        description: string;
    };
}
export type OpenapiContent = {
    content?: {
        [format in OpenapiFormats]: {
            schema: {
                type: OpenapiAllTypes;
                properties?: OpenapiSchemaProperties;
                required?: string[];
            } | OpenapiSchemaObject | OpenapiSchemaArray | OpenapiSchemaExpressionRef | OpenapiSchemaExpressionAnyOf | OpenapiSchemaExpressionAllOf | OpenapiSchemaExpressionOneOf;
        };
    };
    description?: string;
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingControllerActionPairingInRoutes = void 0;
const dream_1 = require("@rvohealth/dream");
const psychic_application_1 = __importDefault(require("../psychic-application"));
const server_1 = __importDefault(require("../server"));
const body_segment_1 = __importDefault(require("./body-segment"));
const defaults_1 = require("./defaults");
const isBlankDescription_1 = __importDefault(require("./helpers/isBlankDescription"));
const openapiRoute_1 = __importDefault(require("./helpers/openapiRoute"));
const serializerToOpenapiSchema_1 = __importDefault(require("./helpers/serializerToOpenapiSchema"));
class OpenapiEndpointRenderer {
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
    constructor(dreamsOrSerializers, controllerClass, action, { requestBody, headers, many, query, responses, serializerKey, status, tags, pathParams, description, nullable, summary, omitDefaultHeaders, omitDefaultResponses, defaultResponse, } = {}) {
        this.dreamsOrSerializers = dreamsOrSerializers;
        this.controllerClass = controllerClass;
        this.action = action;
        this.computedExtraComponents = {};
        this.requestBody = requestBody;
        this.headers = headers;
        this.many = many;
        this.query = query;
        this.responses = responses;
        this.serializerKey = serializerKey;
        this.status = status;
        this.tags = tags;
        this.pathParams = pathParams;
        this.summary = summary;
        this.description = description;
        this.nullable = nullable;
        this.omitDefaultHeaders = omitDefaultHeaders;
        this.omitDefaultResponses = omitDefaultResponses;
        this.defaultResponse = defaultResponse;
    }
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
    async toPathObject(processedSchemas) {
        this.serializers = dream_1.DreamApplication.getOrFail().serializers;
        const [path, method, requestBody, responses] = await Promise.all([
            this.computedPath(),
            this.computedMethod(),
            this.computedRequestBody(processedSchemas),
            this.parseResponses(processedSchemas),
        ]);
        const output = {
            [path]: {
                parameters: [...this.headersArray(), ...(await this.pathParamsArray()), ...this.queryArray()],
                [method]: {
                    tags: this.tags || [],
                },
            },
        };
        if (this.summary) {
            output[path][method].summary = this.summary;
        }
        if (this.description) {
            output[path][method].description = this.description;
        }
        if (requestBody) {
            output[path][method]['requestBody'] = requestBody;
        }
        output[path][method].responses = responses;
        return output;
    }
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
    toSchemaObject(processedSchemas) {
        this.computedExtraComponents = {};
        this.serializers = dream_1.DreamApplication.getOrFail().serializers;
        const serializerClasses = this.getSerializerClasses();
        let output = {};
        (serializerClasses || []).forEach(serializerClass => {
            output = {
                ...output,
                ...(0, serializerToOpenapiSchema_1.default)({
                    serializerClass,
                    schemaDelimeter: this.schemaDelimeter,
                    serializers: this.serializers,
                    processedSchemas,
                }),
            };
        });
        // run this to extract all $serializer refs from responses object
        // and put them into the computedExtraComponents field
        this.parseResponses(processedSchemas);
        return { ...output, ...this.computedExtraComponents };
    }
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
    async computedMethod() {
        if (this._method)
            return this._method;
        try {
            const route = await this.getCurrentRouteConfig();
            this._method = route.httpMethod;
        }
        catch {
            this._method = this.guessHttpMethod();
        }
        return this._method;
    }
    /**
     * @internal
     *
     * Generates the path portion of the openapi payload's
     * "parameters" field for a single endpoint.
     */
    async pathParamsArray() {
        if (this._pathParams)
            return this._pathParams;
        const userProvidedPathParams = (this.pathParams?.map(param => {
            return {
                in: 'path',
                name: param.name,
                required: param.required,
                description: param.description || '',
                schema: {
                    type: 'string',
                },
            };
        }) || []);
        const route = await this.getCurrentRouteConfig();
        const pathSegments = route.path
            .split('/')
            .filter(pathSegment => /^:/.test(pathSegment))
            .map(field => {
            const sanitizedField = field.replace(/^:/, '');
            return {
                in: 'path',
                name: sanitizedField,
                required: true,
                description: sanitizedField,
                schema: {
                    type: 'string',
                },
            };
        });
        this._pathParams = [...pathSegments, ...userProvidedPathParams];
        return this._pathParams;
    }
    /**
     * @internal
     *
     * Takes a guess as to the correct method
     * based on the name of the controller action. If the action is not
     * a standardized crud action, then `get` will be returned.
     */
    guessHttpMethod() {
        switch (this.action) {
            case 'create':
                return 'post';
            case 'destroy':
                return 'delete';
            case 'update':
                return 'patch';
            default:
                return 'get';
        }
    }
    /**
     * @internal
     *
     * returns the path that was provided in the options if it is available.
     * Otherwise, it examines the application's routes to determine
     * a controller action match.
     *
     * If no match is found, a MissingControllerActionPairingInRoutes exception.
     */
    async computedPath() {
        if (this._path)
            return this._path;
        const route = await this.getCurrentRouteConfig();
        this._path = (0, openapiRoute_1.default)(route.path);
        return this._path;
    }
    /**
     * @internal
     *
     * find and memoize the route corresponding to this controller.
     * If no match is found, a MissingControllerActionPairingInRoutes exception.
     */
    async getCurrentRouteConfig() {
        await this._loadRoutes();
        const controllerActionString = this.controllerClass.controllerActionPath(this.action);
        // if the action is update, we want to specifically find the 'patch' route,
        // otherwise we find any route that matches
        let route = this.action === 'update'
            ? this.routes.find(routeConfig => routeConfig.controllerActionString === controllerActionString &&
                routeConfig.httpMethod === 'patch')
            : this.routes.find(routeConfig => routeConfig.controllerActionString === controllerActionString);
        if (!route)
            route = this.routes.find(routeConfig => routeConfig.controllerActionString === controllerActionString);
        if (!route)
            throw new MissingControllerActionPairingInRoutes(this.controllerClass, this.action);
        return route;
    }
    /**
     * @internal
     *
     * loads all routes for this psychic app and memoizes them
     */
    async _loadRoutes() {
        if (this._routes)
            return;
        const server = new server_1.default();
        await server.boot();
        this._routes = await server.routes();
    }
    /**
     * @internal
     *
     * Returns the loaded routes (loaded by the #_loadRoutes method)
     */
    get routes() {
        if (!this._routes)
            throw new Error('must called _loadRoutes before accessing routes property');
        return this._routes;
    }
    /**
     * @internal
     *
     * Generates the header portion of the openapi payload's
     * "parameters" field for a single endpoint.
     */
    headersArray() {
        const psychicApp = psychic_application_1.default.getOrFail();
        const defaultHeaders = this.omitDefaultHeaders ? [] : psychicApp.openapi?.defaults?.headers || [];
        const headers = [...defaultHeaders, ...(this.headers || [])];
        return (headers.map(header => {
            const data = {
                in: 'header',
                name: header.name,
                required: header.required,
                description: header.description || '',
                schema: {
                    type: 'string',
                },
            };
            if (header.format) {
                data.schema.format = header.format;
            }
            return data;
        }) || []);
    }
    /**
     * @internal
     *
     * Generates the header portion of the openapi payload's
     * "parameters" field for a single endpoint.
     */
    queryArray() {
        return (this.query?.map(param => {
            const output = {
                in: 'query',
                ...param,
                description: param.description || '',
                schema: {
                    type: 'string',
                },
            };
            if (typeof param.allowEmptyValue === 'boolean') {
                output.allowEmptyValue = param.allowEmptyValue;
            }
            if (typeof param.allowReserved === 'boolean') {
                output.allowReserved = param.allowReserved;
            }
            return output;
        }) || []);
    }
    /**
     * @internal
     *
     * Generates the requestBody portion of the endpoint
     */
    async computedRequestBody(processedSchemas) {
        const method = await this.computedMethod();
        if (this.requestBody === null)
            return undefined;
        const httpMethodsThatAllowBody = ['post', 'patch', 'put'];
        if (!httpMethodsThatAllowBody.includes(method))
            return undefined;
        if (this.shouldAutogenerateBody()) {
            return this.generateRequestBodyForModel(processedSchemas);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const schema = this.recursivelyParseBody(this.requestBody, processedSchemas);
        if (!schema)
            return undefined;
        return {
            content: {
                'application/json': {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    schema,
                },
            },
        };
    }
    /**
     * @internal
     *
     * determine if the requestBody is meant to identify a special shape
     * used when requestBody is proxying off of the model CB. In these cases,
     * an object with "only" and "required" fields can be passed.
     *
     * This method returns true if it detects that this is the case.
     */
    shouldAutogenerateBody() {
        const body = this.requestBody;
        if (!body)
            return true;
        if (body.only)
            return true;
        if (body.for)
            return true;
        if (body.required && body.type !== 'object')
            return true;
        return false;
    }
    /**
     * @internal
     *
     * Generates a request body by examining the provided model callback.
     * If the callback returns a single model, then all of the params for
     * that model that are safe to ingest will be automatically added to
     * the request body.
     */
    generateRequestBodyForModel(processedSchemas) {
        const forDreamClass = this.requestBody?.for;
        const dreamClass = forDreamClass || this.getSingleDreamModelClass();
        if (!dreamClass)
            return undefined;
        let paramSafeColumns = dreamClass.paramSafeColumnsOrFallback();
        const only = this.requestBody?.only;
        if (only) {
            paramSafeColumns = paramSafeColumns.filter(column => only.includes(column));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const schema = dreamClass.prototype.schema;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const columns = schema[dreamClass.prototype.table]?.columns;
        const paramsShape = {
            type: 'object',
            properties: {},
        };
        const required = this.requestBody?.required;
        if (required) {
            paramsShape.required = required;
        }
        for (const columnName of paramSafeColumns) {
            const columnMetadata = columns[columnName];
            switch (columnMetadata?.dbType) {
                case 'boolean':
                case 'boolean[]':
                case 'date':
                case 'date[]':
                case 'integer':
                case 'integer[]':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: columnMetadata.dbType,
                        },
                    };
                    break;
                case 'character varying':
                case 'citext':
                case 'text':
                case 'uuid':
                case 'bigint':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'string',
                        },
                    };
                    break;
                case 'character varying[]':
                case 'citext[]':
                case 'text[]':
                case 'uuid[]':
                case 'bigint[]':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                    };
                    break;
                case 'timestamp':
                case 'timestamp with time zone':
                case 'timestamp without time zone':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'date-time',
                        },
                    };
                    break;
                case 'timestamp[]':
                case 'timestamp with time zone[]':
                case 'timestamp without time zone[]':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'array',
                            items: {
                                type: 'date-time',
                            },
                        },
                    };
                    break;
                case 'json':
                case 'jsonb':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'object',
                        },
                    };
                    break;
                case 'json[]':
                case 'jsonb[]':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'array',
                            items: {
                                type: 'object',
                            },
                        },
                    };
                    break;
                case 'numeric':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'number',
                        },
                    };
                    break;
                case 'numeric[]':
                    paramsShape.properties = {
                        ...paramsShape.properties,
                        [columnName]: {
                            type: 'array',
                            items: {
                                type: 'number',
                            },
                        },
                    };
                    break;
                default:
                    if (dreamClass.isVirtualColumn(columnName)) {
                        const metadata = dreamClass['virtualAttributes'].find(statement => statement.property === columnName);
                        if (metadata?.type) {
                            paramsShape.properties = {
                                ...paramsShape.properties,
                                [columnName]: this.recursivelyParseBody(metadata.type, processedSchemas),
                            };
                        }
                        else {
                            paramsShape.properties = {
                                ...paramsShape.properties,
                                [columnName]: {
                                    anyOf: [
                                        { type: 'string', nullable: true },
                                        { type: 'number', nullable: true },
                                        { type: 'object', nullable: true },
                                    ],
                                },
                            };
                        }
                    }
                    else if (columnMetadata?.enumValues) {
                        if (columnMetadata.isArray) {
                            paramsShape.properties = {
                                ...paramsShape.properties,
                                [columnName]: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: columnMetadata.enumValues,
                                    },
                                },
                            };
                        }
                        else {
                            paramsShape.properties = {
                                ...paramsShape.properties,
                                [columnName]: {
                                    type: 'string',
                                    enum: columnMetadata.enumValues,
                                },
                            };
                        }
                    }
            }
            if (columnMetadata?.allowNull && paramsShape.properties[columnName]) {
                ;
                paramsShape.properties[columnName].nullable = true;
            }
        }
        return {
            content: {
                'application/json': {
                    schema: this.recursivelyParseBody(paramsShape, processedSchemas),
                },
            },
        };
    }
    /**
     * @internal
     *
     * Generates the responses portion of the endpoint
     */
    parseResponses(processedSchemas) {
        const psychicApp = psychic_application_1.default.getOrFail();
        const defaultResponses = this.omitDefaultResponses ? {} : psychicApp.openapi?.defaults?.responses || {};
        let responseData = {
            ...defaults_1.DEFAULT_OPENAPI_RESPONSES,
            ...defaultResponses,
        };
        const computedStatus = this.status || this.defaultStatus;
        if (this.status === 204) {
            responseData = {
                ...responseData,
                204: {
                    $ref: '#/components/responses/NoContent',
                },
            };
            responseData = this.applyDefaultResponseOptions(responseData, computedStatus);
        }
        else if (!this.responses?.['200'] && !this.responses?.['201'] && !this.responses?.['204']) {
            responseData = {
                ...responseData,
                [computedStatus]: this.parseSerializerResponseShape(),
            };
            responseData = this.applyDefaultResponseOptions(responseData, computedStatus);
        }
        Object.keys(this.responses || {}).forEach(statusCode => {
            const statusCodeInt = parseInt(statusCode);
            const response = this.responses[statusCodeInt];
            responseData[statusCodeInt] = {};
            if (statusCodeInt === computedStatus) {
                responseData = this.applyDefaultResponseOptions(responseData, statusCodeInt);
            }
            if (!responseData[statusCodeInt].description && response.description) {
                ;
                responseData[statusCodeInt].description = response.description;
            }
            else {
                // this is not necessarily the best, but if there is no description provided,
                // the openapi document is invalid. This is here to stop that from happening,
                // though it is a stop gap for a better solution.
                ;
                responseData[statusCodeInt].description = this.action;
            }
            if ((0, isBlankDescription_1.default)(this.responses[statusCodeInt])) {
                ;
                responseData[statusCodeInt] = {
                    ...this.responses[statusCodeInt],
                };
            }
            else {
                ;
                responseData[statusCodeInt].content = {
                    'application/json': {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        schema: this.recursivelyParseBody(this.responses[statusCodeInt], processedSchemas),
                    },
                };
            }
        });
        return responseData;
    }
    applyDefaultResponseOptions(responseData, statusCodeInt) {
        // if (this.summary) {
        //   // responseData[statusCodeInt].summary = this.summary
        // }
        if (this.defaultResponse?.description) {
            ;
            responseData[statusCodeInt].description =
                this.defaultResponse?.description;
        }
        return responseData;
    }
    /**
     * @internal
     *
     * Returns the default status code that should be used
     * if it was not passed.
     */
    get defaultStatus() {
        if (!this.getSerializerClasses())
            return 204;
        return 200;
    }
    /**
     * @internal
     *
     * returns a ref object for the callback passed to the
     * Openapi decorator.
     */
    parseSerializerResponseShape() {
        const serializerClasses = this.getSerializerClasses();
        if (!serializerClasses)
            return { description: 'no content' };
        if (serializerClasses.length > 1) {
            return this.parseMultiEntitySerializerResponseShape();
        }
        return this.parseSingleEntitySerializerResponseShape();
    }
    accountForNullableOption(bodySegment, nullable) {
        if (nullable) {
            return {
                allOf: [bodySegment, { nullable: true }],
            };
        }
        else {
            return bodySegment;
        }
    }
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
    parseSingleEntitySerializerResponseShape() {
        const serializerClass = this.getSerializerClasses()[0];
        const serializerKey = serializerClass.openapiName;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const serializerObject = this.accountForNullableOption({
            $ref: `#/components/schemas/${serializerKey}`,
        }, this.nullable || false);
        const baseSchema = this.many
            ? {
                type: 'array',
                items: serializerObject,
            }
            : serializerObject;
        const finalOutput = {
            content: {
                'application/json': {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                    schema: baseSchema,
                },
            },
            description: this.description || this.action,
        };
        return finalOutput;
    }
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
    parseMultiEntitySerializerResponseShape() {
        const anyOf = { anyOf: [] };
        this.getSerializerClasses().forEach(serializerClass => {
            const serializerKey = serializerClass.openapiName;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const serializerObject = {
                $ref: `#/components/schemas/${serializerKey}`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            };
            anyOf.anyOf.push(serializerObject);
        });
        const baseSchema = this.many
            ? {
                type: 'array',
                items: anyOf,
            }
            : anyOf;
        const finalOutput = {
            content: {
                'application/json': {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                    schema: baseSchema,
                },
            },
        };
        return finalOutput;
    }
    /**
     * @internal
     *
     * returns either the delimiter set in the app config, or else a blank string
     * NOTE: this is only public for testing purposes.
     */
    get schemaDelimeter() {
        const psychicApp = psychic_application_1.default.getOrFail();
        return psychicApp.openapi?.schemaDelimeter || '';
    }
    /**
     * @internal
     *
     * recursive function used to parse nested
     * openapi shorthand objects
     */
    recursivelyParseBody(bodySegment, processedSchemas) {
        const { results, extraComponents } = new body_segment_1.default({
            bodySegment,
            serializers: this.serializers,
            schemaDelimeter: this.schemaDelimeter,
            processedSchemas,
        }).parse();
        this.computedExtraComponents = {
            ...this.computedExtraComponents,
            ...extraComponents,
        };
        return results;
    }
    /**
     * @internal
     *
     * Returns the serializer class either attached directly
     * to this OpenapiEndpointRenderer, or else travels through the
     * attached dream or view model to identify a serializer
     * match.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSerializerClasses() {
        if (!this.dreamsOrSerializers)
            return null;
        if (Array.isArray(this.dreamsOrSerializers)) {
            return (0, dream_1.compact)(this.dreamsOrSerializers.map(s => this.getSerializerClass(s)));
        }
        else {
            return (0, dream_1.compact)([this.getSerializerClass(this.dreamsOrSerializers)]);
        }
    }
    /**
     * @internal
     *
     * Returns the dream model provided to the callback function.
     * If the callback function does not return a single dream model,
     * then this method will return null.
     */
    getSingleDreamModelClass() {
        if (!this.dreamsOrSerializers)
            return null;
        if (Array.isArray(this.dreamsOrSerializers))
            return null;
        if (this.dreamsOrSerializers?.isDream) {
            return this.dreamsOrSerializers;
        }
        return null;
    }
    /**
     * @internal
     *
     * Uses the provided entity to resolve to a serializer class.
     */
    getSerializerClass(dreamOrSerializerOrViewModel) {
        const dreamApp = dream_1.DreamApplication.getOrFail();
        if (dreamOrSerializerOrViewModel.isDreamSerializer) {
            return dreamOrSerializerOrViewModel;
        }
        else {
            const modelClass = dreamOrSerializerOrViewModel;
            const modelPrototype = modelClass.prototype;
            const serializerKey = modelPrototype.serializers[(this.serializerKey || 'default')];
            return dreamApp.serializers[serializerKey] || null;
        }
    }
}
exports.default = OpenapiEndpointRenderer;
class MissingControllerActionPairingInRoutes extends Error {
    constructor(controllerClass, action) {
        super();
        this.controllerClass = controllerClass;
        this.action = action;
    }
    get message() {
        return `
OpenAPI decorator has been applied to method '${this.action}' in '${this.controllerClass.name}',
but no route maps to this method in your conf/routes.ts file.

Either remove the @OpenAPI decorator for '${this.action}', or add a route to the
routes file which will direct to this controller class and method.`;
    }
}
exports.MissingControllerActionPairingInRoutes = MissingControllerActionPairingInRoutes;

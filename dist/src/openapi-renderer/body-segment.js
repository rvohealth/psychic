"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const isBlankDescription_1 = __importDefault(require("./helpers/isBlankDescription"));
const serializerToOpenapiSchema_1 = __importDefault(require("./helpers/serializerToOpenapiSchema"));
class OpenapiBodySegmentRenderer {
    /**
     * @internal
     *
     * Used to recursively parse nested object structures
     * within nested openapi objects
     */
    constructor({ bodySegment, serializers, schemaDelimeter, processedSchemas, }) {
        this.computedExtraComponents = {};
        this.bodySegment = bodySegment;
        this.serializers = serializers;
        this.schemaDelimeter = schemaDelimeter;
        this.processedSchemas = processedSchemas;
    }
    /**
     * returns the shorthanded body segment, parsed
     * to the appropriate openapi shape
     */
    parse() {
        const results = this.recursivelyParseBody(this.bodySegment);
        return {
            results,
            extraComponents: this.computedExtraComponents,
        };
    }
    /**
     * @internal
     *
     * Recursively parses nested objects and arrays,
     * as well as primitive types
     */
    recursivelyParseBody(bodySegment) {
        switch (this.segmentType(bodySegment)) {
            case 'blank_description':
                return bodySegment;
            case 'oneOf':
                return this.oneOfStatement(bodySegment);
            case 'anyOf':
                return this.anyOfStatement(bodySegment);
            case 'allOf':
                return this.allOfStatement(bodySegment);
            case 'object':
                return this.objectStatement(bodySegment);
            case 'array':
                return this.arrayStatement(bodySegment);
            case 'openapi_primitive_literal':
                return this.primitiveLiteralStatement(bodySegment);
            case 'openapi_primitive_object':
                return this.primitiveObjectStatement(bodySegment);
            case '$ref':
                return this.refStatement(bodySegment);
            case '$schema':
                return this.schemaRefStatement(bodySegment);
            case '$serializer':
                return this.serializerStatement(bodySegment);
            case 'unknown_object':
                return this.unknownObjectStatement(bodySegment);
            case undefined:
                return { type: 'object' };
        }
    }
    /**
     * @internal
     *
     * Returns a type based on analysis of the bodySegment
     */
    segmentType(bodySegment) {
        if (bodySegment === undefined)
            return undefined;
        const objectBodySegment = bodySegment;
        const arrayBodySegment = bodySegment;
        const oneOfBodySegment = bodySegment;
        const anyOfBodySegment = bodySegment;
        const allOfBodySegment = bodySegment;
        const refBodySegment = bodySegment;
        const schemaRefBodySegment = bodySegment;
        const serializerRefBodySegment = bodySegment;
        if ((0, isBlankDescription_1.default)(bodySegment))
            return 'blank_description';
        if (serializerRefBodySegment.$serializer)
            return '$serializer';
        if (refBodySegment.$ref)
            return '$ref';
        if (schemaRefBodySegment.$schema)
            return '$schema';
        if (oneOfBodySegment.oneOf)
            return 'oneOf';
        if (anyOfBodySegment.anyOf)
            return 'anyOf';
        if (allOfBodySegment.allOf)
            return 'allOf';
        if (objectBodySegment.type === 'object')
            return 'object';
        else if (arrayBodySegment.type === 'array')
            return 'array';
        else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
            if (dream_1.openapiShorthandPrimitiveTypes.includes(bodySegment))
                return 'openapi_primitive_literal';
            if (typeof bodySegment === 'object') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
                if (dream_1.openapiPrimitiveTypes.includes(bodySegment.type))
                    return 'openapi_primitive_object';
            }
            if (typeof bodySegment === 'object')
                return 'unknown_object';
        }
    }
    /**
     * @internal
     *
     * recursively parses a oneOf statement
     */
    oneOfStatement(bodySegment) {
        const oneOfBodySegment = bodySegment;
        return {
            oneOf: oneOfBodySegment.oneOf.map(segment => this.recursivelyParseBody(segment)),
        };
    }
    /**
     * @internal
     *
     * recursively parses an anyOf statement
     */
    anyOfStatement(bodySegment) {
        const anyOfBodySegment = bodySegment;
        return {
            anyOf: anyOfBodySegment.anyOf.map(segment => this.recursivelyParseBody(segment)),
        };
    }
    /**
     * @internal
     *
     * recursively parses an allOf statement
     */
    allOfStatement(bodySegment) {
        const allOfBodySegment = bodySegment;
        return {
            allOf: allOfBodySegment.allOf.map(segment => this.recursivelyParseBody(segment)),
        };
    }
    /**
     * @internal
     *
     * recursively parses an array statement
     */
    arrayStatement(bodySegment) {
        const data = this.applyCommonFieldsToPayload({
            type: 'array',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
            items: this.recursivelyParseBody(bodySegment.items),
        });
        if (bodySegment.nullable) {
            data.nullable = true;
        }
        return data;
    }
    /**
     * @internal
     *
     * recursively parses an object statement
     */
    objectStatement(bodySegment) {
        const objectBodySegment = bodySegment;
        const data = {
            type: 'object',
        };
        if (objectBodySegment.description) {
            data.description = objectBodySegment.description;
        }
        if (objectBodySegment.nullable) {
            data.nullable = true;
        }
        if (objectBodySegment.summary) {
            data.summary = objectBodySegment.summary;
        }
        if (objectBodySegment.maxProperties) {
            data.maxProperties = objectBodySegment.maxProperties;
        }
        if (objectBodySegment.minProperties) {
            data.minProperties = objectBodySegment.minProperties;
        }
        if (objectBodySegment.additionalProperties) {
            data.additionalProperties = this.parseObjectPropertyStatement(objectBodySegment.additionalProperties);
        }
        if (Array.isArray(objectBodySegment.required))
            data.required = objectBodySegment.required;
        if (objectBodySegment.properties) {
            data.properties = this.parseObjectPropertyStatement(objectBodySegment.properties);
        }
        return data;
    }
    /**
     * @internal
     *
     * parses either the `properties` or `additionalProperties` values
     * on an object
     */
    parseObjectPropertyStatement(propertySegment) {
        if (propertySegment.oneOf ||
            propertySegment.allOf ||
            propertySegment.anyOf) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            return this.recursivelyParseBody(propertySegment);
        }
        const objectBodySegment = propertySegment;
        Object.keys(objectBodySegment || {}).forEach(key => {
            ;
            propertySegment[key] =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                this.recursivelyParseBody(objectBodySegment[key]);
        });
        return propertySegment;
    }
    /**
     * @internal
     *
     * recursively parses a primitive literal type (i.e. string or boolean[])
     */
    primitiveLiteralStatement(bodySegment) {
        return this.parseAttributeValue(bodySegment);
    }
    /**
     * @internal
     *
     * recursively parses a primitive object type (i.e. { type: 'string[]' })
     */
    primitiveObjectStatement(bodySegment) {
        const objectBodySegment = bodySegment;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        return this.applyCommonFieldsToPayload(objectBodySegment);
    }
    /**
     * @internal
     *
     * recursively a $ref statement
     */
    refStatement(bodySegment) {
        const refBodySegment = bodySegment;
        return {
            $ref: `#/${refBodySegment.$ref.replace(/^#\//, '')}`,
        };
    }
    /**
     * @internal
     *
     * recursively a $ref statement
     */
    serializerStatement(bodySegment) {
        const serializerRefBodySegment = bodySegment;
        const serializerKey = serializerRefBodySegment.$serializer.openapiName;
        this.computedExtraComponents = {
            ...this.computedExtraComponents,
            ...(0, serializerToOpenapiSchema_1.default)({
                serializerClass: serializerRefBodySegment.$serializer,
                serializers: this.serializers,
                schemaDelimeter: this.schemaDelimeter,
                processedSchemas: this.processedSchemas,
            }),
        };
        if (serializerRefBodySegment.many) {
            const returnVal = {
                type: 'array',
                items: {
                    $ref: `#/components/schemas/${serializerKey}`,
                },
            };
            if (serializerRefBodySegment.nullable)
                returnVal.nullable = true;
            return returnVal;
        }
        else {
            if (serializerRefBodySegment.nullable) {
                return {
                    allOf: [{ $ref: `#/components/schemas/${serializerKey}` }, { nullable: true }],
                };
            }
            else {
                return {
                    $ref: `#/components/schemas/${serializerKey}`,
                };
            }
        }
    }
    /**
     * @internal
     *
     * recursively a $schema statement
     */
    schemaRefStatement(bodySegment) {
        const schemaRefBodySegment = bodySegment;
        return {
            $ref: `#/components/schemas/${schemaRefBodySegment.$schema.replace(/^#\/components\/schemas\//, '')}`,
        };
    }
    /**
     * @internal
     *
     * recursively an unknown_object statement
     */
    unknownObjectStatement(bodySegment) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.applyCommonFieldsToPayload(bodySegment);
    }
    /**
     * @internal
     *
     * parses a primitive stored type
     */
    parseAttributeValue(data) {
        if (!data)
            return {
                type: 'object',
                nullable: true,
            };
        switch (data) {
            case 'string[]':
            case 'number[]':
            case 'boolean[]':
            case 'integer[]':
                return (0, dream_1.compact)({
                    type: 'array',
                    items: {
                        type: this.serializerTypeToOpenapiType(data),
                    },
                });
            case 'decimal[]':
            case 'double[]':
                return (0, dream_1.compact)({
                    type: 'array',
                    items: {
                        type: 'number',
                        format: data.replace(/\[\]$/, ''),
                    },
                });
            case 'date[]':
            case 'date-time[]':
                return (0, dream_1.compact)({
                    type: 'array',
                    items: {
                        type: 'string',
                        format: data.replace(/\[\]$/, ''),
                    },
                });
            case 'decimal':
            case 'double':
                return (0, dream_1.compact)({
                    type: 'number',
                    format: data,
                });
            case 'date':
            case 'date-time':
                return (0, dream_1.compact)({
                    type: 'string',
                    format: data,
                });
            default:
                return (0, dream_1.compact)({
                    type: this.serializerTypeToOpenapiType(data),
                });
        }
    }
    /**
     * @internal
     *
     * sanitizes primitive openapi type before putting in
     * openapi type fields
     */
    serializerTypeToOpenapiType(type) {
        switch (type) {
            case 'date':
            case 'date-time':
            case 'date[]':
            case 'date-time[]':
                return 'string';
            default:
                return type.replace(/\[\]$/, '');
        }
    }
    /**
     * @internal
     *
     * binds shared openapi fields to any object
     */
    applyCommonFieldsToPayload(obj) {
        const objectCast = obj;
        const returnObj = {
            ...obj,
        };
        if (objectCast.nullable) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            ;
            returnObj.nullable = true;
        }
        if (objectCast.description) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            ;
            returnObj.description = objectCast.description;
        }
        if (objectCast.summary) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            ;
            returnObj.summary = objectCast.summary;
        }
        return returnObj;
    }
}
exports.default = OpenapiBodySegmentRenderer;

import { DreamSerializer, OpenapiSchemaBody, OpenapiSchemaBodyShorthand, OpenapiSchemaObject, OpenapiShorthandPrimitiveTypes } from '@rvohealth/dream';
export default class OpenapiBodySegmentRenderer {
    private bodySegment;
    private serializers;
    private schemaDelimeter;
    private computedExtraComponents;
    private processedSchemas;
    /**
     * @internal
     *
     * Used to recursively parse nested object structures
     * within nested openapi objects
     */
    constructor({ bodySegment, serializers, schemaDelimeter, processedSchemas, }: {
        bodySegment: OpenapiBodySegment;
        serializers: {
            [key: string]: typeof DreamSerializer;
        };
        schemaDelimeter: string;
        processedSchemas: Record<string, boolean>;
    });
    /**
     * returns the shorthanded body segment, parsed
     * to the appropriate openapi shape
     */
    parse(): OpenapiEndpointParseResults;
    /**
     * @internal
     *
     * Recursively parses nested objects and arrays,
     * as well as primitive types
     */
    recursivelyParseBody(bodySegment: OpenapiBodySegment): OpenapiSchemaBody;
    /**
     * @internal
     *
     * Returns a type based on analysis of the bodySegment
     */
    private segmentType;
    /**
     * @internal
     *
     * recursively parses a oneOf statement
     */
    private oneOfStatement;
    /**
     * @internal
     *
     * recursively parses an anyOf statement
     */
    private anyOfStatement;
    /**
     * @internal
     *
     * recursively parses an allOf statement
     */
    private allOfStatement;
    /**
     * @internal
     *
     * recursively parses an array statement
     */
    private arrayStatement;
    /**
     * @internal
     *
     * recursively parses an object statement
     */
    private objectStatement;
    /**
     * @internal
     *
     * parses either the `properties` or `additionalProperties` values
     * on an object
     */
    private parseObjectPropertyStatement;
    /**
     * @internal
     *
     * recursively parses a primitive literal type (i.e. string or boolean[])
     */
    private primitiveLiteralStatement;
    /**
     * @internal
     *
     * recursively parses a primitive object type (i.e. { type: 'string[]' })
     */
    private primitiveObjectStatement;
    /**
     * @internal
     *
     * recursively a $ref statement
     */
    private refStatement;
    /**
     * @internal
     *
     * recursively a $ref statement
     */
    private serializerStatement;
    /**
     * @internal
     *
     * recursively a $schema statement
     */
    private schemaRefStatement;
    /**
     * @internal
     *
     * recursively an unknown_object statement
     */
    private unknownObjectStatement;
    /**
     * @internal
     *
     * parses a primitive stored type
     */
    private parseAttributeValue;
    /**
     * @internal
     *
     * sanitizes primitive openapi type before putting in
     * openapi type fields
     */
    private serializerTypeToOpenapiType;
    /**
     * @internal
     *
     * binds shared openapi fields to any object
     */
    private applyCommonFieldsToPayload;
}
export type OpenapiEndpointParseResults = {
    results: OpenapiSchemaBody;
    extraComponents: {
        [key: string]: OpenapiSchemaObject;
    };
};
export type OpenapiBodySegment = OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | {
    description: string;
} | undefined;

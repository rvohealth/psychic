"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const envValue_1 = require("../../helpers/envValue");
const body_segment_1 = __importDefault(require("../body-segment"));
/**
 * @internal
 *
 * builds the definition for the endpoint's serializer
 * to be placed in the components/schemas path
 */
function serializerToOpenapiSchema({ serializerClass, schemaDelimeter, serializers, processedSchemas, }) {
    if (processedSchemas[serializerClass.globalName])
        return {};
    processedSchemas[serializerClass.globalName] = true;
    const attributes = serializerClass['attributeStatements'];
    const serializerKey = serializerClass.openapiName;
    const serializerObject = {
        type: 'object',
        required: [],
        properties: {},
    };
    let componentsSchema = {};
    attributes.forEach(attr => {
        serializerObject.required.push(attr.field);
        const { results, extraComponents } = recursivelyParseBody({
            bodySegment: attr.renderAs,
            serializers,
            schemaDelimeter,
            processedSchemas,
        });
        componentsSchema = { ...componentsSchema, ...extraComponents };
        serializerObject.properties[attr.field] = results;
    });
    const serializerPayload = attachAssociationsToSerializerPayload({
        serializerClass,
        serializerPayload: { [serializerKey]: serializerObject, ...componentsSchema },
        serializerKey,
        serializers,
        schemaDelimeter,
        processedSchemas,
    });
    return { ...serializerPayload, ...componentsSchema };
}
exports.default = serializerToOpenapiSchema;
/**
 * @internal
 *
 * for each association existing on a given serializer,
 * attach the association's schema to the component schema
 * output, and also generate a $ref between the base
 * serializer and the new one.
 */
function attachAssociationsToSerializerPayload({ serializerClass, serializerPayload, serializerKey, serializers, schemaDelimeter, processedSchemas, }) {
    const associations = serializerClass['associationStatements'];
    let finalOutput = { ...serializerPayload };
    associations.forEach(association => {
        const associatedSerializers = dream_1.DreamSerializer.getAssociatedSerializersForOpenapi(association);
        if (!associatedSerializers)
            throw new Error(`
Error: ${serializerClass.name} missing explicit serializer definition for ${association.type} ${association.field}, using type: 'object'
`);
        if (associatedSerializers.length === 1) {
            // point the association directly to the schema
            finalOutput = addSingleSerializerAssociationToOutput({
                association,
                serializerKey,
                finalOutput,
                associatedSerializers,
                serializers,
                schemaDelimeter,
                processedSchemas,
            });
        }
        else {
            // leverage anyOf to handle an array of serializers
            finalOutput = addMultiSerializerAssociationToOutput({
                association,
                serializerKey,
                finalOutput,
                associatedSerializers,
                serializers,
                schemaDelimeter,
                processedSchemas,
            });
        }
    });
    return finalOutput;
}
/**
 * @internal
 *
 * points an association directly to the $ref associated
 * with the target serializer, and add target serializer
 * to the schema
 */
function addSingleSerializerAssociationToOutput({ associatedSerializers, finalOutput, serializerKey, association, serializers, schemaDelimeter, processedSchemas, }) {
    const associatedSerializer = associatedSerializers[0];
    const associatedSerializerKey = associatedSerializer.openapiName;
    if ((0, envValue_1.envBool)('DEBUG'))
        console.log(`Processing serializer ${associatedSerializerKey}`);
    finalOutput[serializerKey].required = (0, dream_1.uniq)([
        ...(finalOutput[serializerKey].required || []),
        association.field,
    ]);
    switch (association.type) {
        case 'RendersMany':
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            ;
            finalOutput[serializerKey].properties[association.field] = {
                type: 'array',
                items: {
                    $ref: `#/components/schemas/${associatedSerializerKey}`,
                },
            };
            break;
        case 'RendersOne':
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            ;
            finalOutput[serializerKey].properties[association.field] = accountForNullableOption({
                $ref: `#/components/schemas/${associatedSerializerKey}`,
            }, association.nullable);
            break;
    }
    const associatedSchema = serializerToOpenapiSchema({
        serializerClass: associatedSerializer,
        serializers,
        schemaDelimeter,
        processedSchemas,
    });
    finalOutput = { ...finalOutput, ...associatedSchema };
    return finalOutput;
}
/**
 * @internal
 *
 * leverages anyOf to cast multiple possible $ref values,
 * each pointing to its respective target serializer.
 */
function addMultiSerializerAssociationToOutput({ associatedSerializers, finalOutput, serializerKey, association, serializers, schemaDelimeter, processedSchemas, }) {
    const anyOf = [];
    associatedSerializers.forEach(associatedSerializer => {
        const associatedSerializerKey = associatedSerializer.openapiName;
        if ((0, envValue_1.envBool)('DEBUG'))
            console.log(`Processing serializer ${associatedSerializerKey}`);
        finalOutput[serializerKey].required = (0, dream_1.uniq)([
            ...(finalOutput[serializerKey].required || []),
            association.field,
        ]);
        switch (association.type) {
            case 'RendersMany':
                anyOf.push({
                    type: 'array',
                    items: {
                        $ref: `#/components/schemas/${associatedSerializerKey}`,
                    },
                });
                break;
            case 'RendersOne':
                anyOf.push({
                    $ref: `#/components/schemas/${associatedSerializerKey}`,
                });
                break;
        }
        const associatedSchema = serializerToOpenapiSchema({
            serializerClass: associatedSerializer,
            serializers,
            schemaDelimeter,
            processedSchemas,
        });
        finalOutput = { ...finalOutput, ...associatedSchema };
    });
    finalOutput[serializerKey].properties[association.field] = {
        anyOf,
    };
    return finalOutput;
}
function recursivelyParseBody({ bodySegment, serializers, schemaDelimeter, processedSchemas, }) {
    return new body_segment_1.default({
        bodySegment,
        serializers: serializers,
        schemaDelimeter: schemaDelimeter,
        processedSchemas,
    }).parse();
}
function accountForNullableOption(bodySegment, nullable) {
    if (nullable) {
        return {
            allOf: [bodySegment, { nullable: true }],
        };
    }
    else {
        return bodySegment;
    }
}

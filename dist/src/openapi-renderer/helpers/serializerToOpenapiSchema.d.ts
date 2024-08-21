import { DreamSerializer, OpenapiSchemaObject } from '@rvohealth/dream';
/**
 * @internal
 *
 * builds the definition for the endpoint's serializer
 * to be placed in the components/schemas path
 */
export default function serializerToOpenapiSchema({ serializerClass, schemaDelimeter, serializers, processedSchemas, }: {
    serializerClass: typeof DreamSerializer;
    serializers: {
        [key: string]: typeof DreamSerializer;
    };
    schemaDelimeter: string;
    processedSchemas: Record<string, boolean>;
}): Record<string, OpenapiSchemaObject>;

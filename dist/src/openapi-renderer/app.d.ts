import { OpenapiSchema } from './endpoint';
export default class OpenapiAppRenderer {
    /**
     * @internal
     *
     * reads the lates openapi builds using buildOpenapiObject, and syncs
     * the contents to the openapi.json file at the project root.
     */
    static sync(): Promise<void>;
    /**
     * @internal
     *
     * builds a new typescript object which contains the combined
     * payloads of all `@Openapi` decorator calls used throughout
     * the controller layer.
     */
    static toObject(): Promise<OpenapiSchema>;
    private static sortedSchemaPayload;
}

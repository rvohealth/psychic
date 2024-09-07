export interface NewAppCLIOptions {
    apiOnly: boolean;
    redis: boolean;
    ws: boolean;
    primaryKeyType: 'uuid' | 'integer' | 'bigint' | 'bigserial';
    client: FrontEndClientType;
}
export declare const primaryKeyTypes: readonly ["bigserial", "bigint", "integer", "uuid"];
export declare const clientTypes: readonly ["react", "vue", "nuxt", "none (api only)", "none"];
export type FrontEndClientType = 'react' | 'vue' | 'nuxt' | null;
export default function gatherUserInput(args: string[]): Promise<NewAppCLIOptions>;

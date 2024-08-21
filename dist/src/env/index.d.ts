declare class Env {
    loaded: boolean;
    load(): void;
    ensureLoaded(): void;
    private check;
}
declare const env: Env;
export default env;

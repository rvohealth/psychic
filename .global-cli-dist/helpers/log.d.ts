export declare class Logger {
    cache: string[];
    loaders: Loader[];
    write(text: string, { cache }?: {
        cache?: boolean;
    }): void;
    loader(text?: string): void;
    restoreCache(preRestoreContent?: string): void;
    clear(): void;
}
declare class Loader {
    type: LoaderType;
    index: number;
    interval: any;
    constructor(type: LoaderType);
    start(text?: string): this;
    stop(): void;
}
type LoaderType = 'dots' | 'cats';
declare const log: Logger;
export default log;

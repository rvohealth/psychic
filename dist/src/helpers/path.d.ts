/// <reference types="node" />
export declare function loadFile(filepath: string): Promise<Buffer>;
export declare function writeFile(filepath: string, contents: string): Promise<void>;
export declare function clientApiFileName(): Promise<string>;

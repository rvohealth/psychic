export type TypescriptFileType = `${string}.ts`;
export default function nodeOrTsnodeCmd(filePath: TypescriptFileType, programArgs: string[], { nodeFlags, tsnodeFlags, fileArgs, }?: {
    nodeFlags?: string[];
    tsnodeFlags?: string[];
    fileArgs?: string[];
}): string;

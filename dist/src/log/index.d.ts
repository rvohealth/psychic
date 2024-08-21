export declare class Logger {
    get header(): string;
    puts(text: string, color?: string): void;
    info(text: string): void;
    error(error: Error | string): void;
    welcome(): void;
}
declare const log: Logger;
export default log;

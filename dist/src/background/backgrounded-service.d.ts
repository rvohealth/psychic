import { BackgroundQueuePriority } from '.';
export default function backgroundedService(priority?: BackgroundQueuePriority): {
    new (): {
        background(methodName: string, { args, constructorArgs, }?: {
            args?: any[];
            constructorArgs?: any[];
        }): Promise<void>;
        backgroundWithDelay(delaySeconds: number, methodName: string, { args, constructorArgs, }?: {
            args?: any[];
            constructorArgs?: any[];
        }): Promise<void>;
    };
    readonly globalName: string;
    setGlobalName(globalName: string): void;
    _globalName: string | undefined;
    background(methodName: string, ...args: any[]): Promise<void>;
    backgroundWithDelay(delaySeconds: number, methodName: string, ...args: any[]): Promise<void>;
};

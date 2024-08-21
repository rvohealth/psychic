import { BackgroundQueuePriority } from '../background';
export default function scheduledService(priority?: BackgroundQueuePriority): {
    new (): {};
    readonly globalName: string;
    setGlobalName(globalName: string): void;
    _globalName: string | undefined;
    schedule(pattern: string, methodName: string, ...args: any[]): Promise<void>;
};

import { Dream, IdType } from '@rvohealth/dream';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
type JobTypes = 'BackgroundJobQueueFunctionJob' | 'BackgroundJobQueueStaticJob' | 'BackgroundJobQueueInstanceJob' | 'BackgroundJobQueueModelInstanceJob';
export interface BackgroundJobData {
    id?: IdType;
    method?: string;
    args: any;
    constructorArgs?: any;
    filepath?: string;
    importKey?: string;
    globalName?: string;
    priority: BackgroundQueuePriority;
}
export declare class Background {
    queue: Queue | null;
    queueEvents: QueueEvents;
    workers: Worker[];
    connect(): void;
    staticMethod(ObjectClass: Record<'name', string>, method: string, { delaySeconds, globalName, args, priority, }: {
        globalName: string;
        filepath?: string;
        delaySeconds?: number;
        importKey?: string;
        args?: any[];
        priority?: BackgroundQueuePriority;
    }): Promise<void>;
    scheduledMethod(ObjectClass: Record<'name', string>, pattern: string, method: string, { globalName, args, priority, }: {
        globalName: string;
        filepath?: string;
        importKey?: string;
        args?: any[];
        priority?: BackgroundQueuePriority;
    }): Promise<void>;
    instanceMethod(ObjectClass: Record<'name', string>, method: string, { delaySeconds, globalName, args, constructorArgs, priority, }: {
        globalName: string;
        delaySeconds?: number;
        filepath?: string;
        importKey?: string;
        args?: any[];
        constructorArgs?: any[];
        priority?: BackgroundQueuePriority;
    }): Promise<void>;
    modelInstanceMethod(modelInstance: Dream, method: string, { delaySeconds, args, priority, }: {
        delaySeconds?: number;
        importKey?: string;
        args?: any[];
        priority?: BackgroundQueuePriority;
    }): Promise<void>;
    _addToQueue(jobType: JobTypes, jobData: BackgroundJobData, { delaySeconds, }: {
        delaySeconds?: number;
    }): Promise<void>;
    private getPriorityForQueue;
    doWork(jobType: JobTypes, { id, method, args, constructorArgs, filepath, importKey, globalName }: BackgroundJobData): Promise<void>;
    handler(job: Job<any, any, string>): Promise<void>;
}
declare const background: Background;
export default background;
export declare function stopBackgroundWorkers(): Promise<void>;
export type BackgroundQueuePriority = 'default' | 'urgent' | 'not_urgent' | 'last';

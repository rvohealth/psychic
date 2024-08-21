import PsychicController from '../../controller';
export default function loadControllers(controllersPath: string): Promise<Record<string, typeof PsychicController>>;
export declare function getControllersOrFail(): Record<string, typeof PsychicController>;
export declare function getControllersOrBlank(): Record<string, typeof PsychicController>;

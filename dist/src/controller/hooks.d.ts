export declare class ControllerHook {
    controllerClassName: string;
    methodName: string;
    isStatic: boolean;
    only: string[];
    except: string[];
    constructor(controllerClassName: string, methodName: string, { isStatic, only, except, }: {
        isStatic?: boolean;
        only?: string[];
        except?: string[];
    });
    shouldFireForAction(actionName: string): boolean;
}

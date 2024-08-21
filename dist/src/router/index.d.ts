import { Application, Request, Response, Router } from 'express';
import PsychicController from '../controller';
import PsychicApplication from '../psychic-application';
import RouteManager from './route-manager';
import { HttpMethod, ResourcesOptions } from './types';
export default class PsychicRouter {
    app: Application;
    config: PsychicApplication;
    currentNamespaces: NamespaceConfig[];
    routeManager: RouteManager;
    constructor(app: Application, config: PsychicApplication);
    get routingMechanism(): Application | Router;
    get routes(): import("./route-manager").RouteConfig[];
    private get currentNamespacePaths();
    commit(): void;
    get(path: string, controllerActionString: string): void;
    post(path: string, controllerActionString: string): void;
    put(path: string, controllerActionString: string): void;
    patch(path: string, controllerActionString: string): void;
    delete(path: string, controllerActionString: string): void;
    options(path: string, controllerActionString: string): void;
    private prefixControllerActionStringWithNamespaces;
    private prefixPathWithNamespaces;
    crud(httpMethod: HttpMethod, path: string, controllerActionString: string): void;
    namespace(namespace: string, cb: (router: PsychicNestedRouter) => void): void;
    scope(scope: string, cb: (router: PsychicNestedRouter) => void): void;
    resources(path: string, optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouter) => void), cb?: (router: PsychicNestedRouter) => void): void;
    resource(path: string, optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouter) => void), cb?: (router: PsychicNestedRouter) => void): void;
    collection(cb: (router: PsychicNestedRouter) => void): void;
    private makeResource;
    private _makeResource;
    private runNestedCallbacks;
    private addNamespace;
    private removeLastNamespace;
    private makeRoomForNewIdParam;
    handle(controllerActionString: string, { req, res, }: {
        req: Request;
        res: Response;
    }): Promise<void>;
    _initializeController(ControllerClass: typeof PsychicController, req: Request, res: Response, action: string): PsychicController;
}
export declare class PsychicNestedRouter extends PsychicRouter {
    router: Router;
    constructor(app: Application, config: PsychicApplication, routeManager: RouteManager, { namespaces, }?: {
        namespaces?: NamespaceConfig[];
    });
    get routingMechanism(): Router;
}
export interface NamespaceConfig {
    namespace: string;
    resourceful: boolean;
    isScope: boolean;
}

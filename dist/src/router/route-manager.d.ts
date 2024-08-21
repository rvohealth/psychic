import { HttpMethod } from './types';
export default class RouteManager {
    routes: RouteConfig[];
    addRoute({ httpMethod, path, controllerActionString, }: {
        httpMethod: HttpMethod;
        path: string;
        controllerActionString: string;
    }): void;
}
export interface RouteConfig {
    controllerActionString: string;
    path: string;
    httpMethod: HttpMethod;
}

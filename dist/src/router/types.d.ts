export type ResourcesMethodType = 'index' | 'create' | 'update' | 'show' | 'destroy';
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';
export declare const ResourcesMethods: ResourcesMethodType[];
export declare const ResourceMethods: ResourcesMethodType[];
export declare const HttpMethods: HttpMethod[];
export interface ResourcesOptions {
    only?: ResourcesMethodType[];
    except?: ResourcesMethodType[];
    controller?: string;
}

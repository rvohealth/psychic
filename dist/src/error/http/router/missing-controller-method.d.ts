import RouterError from './index';
export default class RouterMissingControllerMethod extends RouterError {
    constructor(controllerPath: string, method: string);
}

import RouterError from './index';
export default class RouterMissingController extends RouterError {
    constructor(controllerPath: string);
}

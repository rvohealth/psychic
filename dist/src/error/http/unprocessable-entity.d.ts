import HttpError from './index';
export default class UnprocessableEntity extends HttpError {
    constructor(message: string, data: any);
}

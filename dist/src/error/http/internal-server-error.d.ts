import HttpError from './index';
export default class InternalServerError extends HttpError {
    constructor(message: string, data: any);
}

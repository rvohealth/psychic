import HttpError from './index';
export default class BadRequest extends HttpError {
    constructor(message: string, data: any);
}

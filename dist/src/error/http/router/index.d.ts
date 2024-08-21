import HttpError from '../index';
export default class RouterError extends HttpError {
    constructor(message: string, httpStatusCode?: number);
    get message(): string;
}

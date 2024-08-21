import HttpError from './index';
export default class NotFound extends HttpError {
    constructor(message: string);
}

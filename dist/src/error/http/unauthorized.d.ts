import HttpError from './index';
export default class Unauthorized extends HttpError {
    constructor(message: string);
}

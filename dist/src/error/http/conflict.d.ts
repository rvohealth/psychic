import HttpError from './index';
export default class Conflict extends HttpError {
    constructor(message: string);
}

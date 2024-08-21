import DBError from './index';
export default class DBMissingOptions extends DBError {
    constructor(error: Error);
}

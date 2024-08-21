import DBError from './index';
export default class DBFailedToConnect extends DBError {
    constructor(error: Error);
}

export default class DBError extends Error {
    private _message;
    constructor(message: string);
    get message(): string;
}

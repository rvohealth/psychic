export default class HttpError extends Error {
    status: number;
    data: any;
    protected _message: string;
    constructor(statusCode: number, message: string, data?: any);
    get message(): string;
}

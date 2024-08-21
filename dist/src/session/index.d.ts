import { CookieOptions, Request, Response } from 'express';
import { CustomCookieOptions } from '../psychic-application';
export default class Session {
    private req;
    private res;
    constructor(req: Request, res: Response);
    getCookie(name: string): string | import("jsonwebtoken").JwtPayload | null;
    setCookie(name: string, data: string, opts?: CustomSessionCookieOptions): void;
    clearCookie(name: string): void;
    daysToMilliseconds(numDays: number): number;
}
export type CustomSessionCookieOptions = Omit<CookieOptions, 'maxAge'> & CustomCookieOptions;

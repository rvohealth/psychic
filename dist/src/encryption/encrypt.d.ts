import jwt from 'jsonwebtoken';
export default class Encrypt {
    static sign(data: string): string;
    static decode(encrypted: string): string | jwt.JwtPayload | null;
}

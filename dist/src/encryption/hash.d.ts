export default class Hash {
    static get saltRounds(): number;
    static gen(plaintext: string): Promise<string>;
    static check(plaintext: string, hash: string): Promise<boolean>;
}

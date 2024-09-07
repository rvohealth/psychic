export default class Select<T extends readonly any[]> {
    private question;
    private selectIndex;
    private options;
    private selector;
    private isFirstTimeShowMenu;
    private cb;
    constructor(question: string, options: T);
    run(): Promise<T[number]>;
    private keyPressedHandler;
    private ansiEraseLines;
    private init;
    private start;
    close: () => never;
    private getPadding;
    private createOptionMenu;
}

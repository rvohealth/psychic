"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors = __importStar(require("colorette"));
const readline = __importStar(require("readline"));
const input = process.stdin;
const output = process.stdout;
let firstCallComplete = false;
class Select {
    constructor(question, options) {
        this.selectIndex = 0;
        this.selector = '>';
        this.isFirstTimeShowMenu = true;
        this.cb = null;
        this.close = () => {
            input.setRawMode(false);
            input.pause();
            process.exit(0);
        };
        this.question = question;
        this.options = options;
    }
    async run() {
        await this.init();
        return new Promise(accept => {
            this.cb = accept;
        });
    }
    keyPressedHandler(_, key) {
        if (key) {
            const optionLength = this.options.length - 1;
            if (key.name === 'down' && this.selectIndex < optionLength) {
                this.selectIndex += 1;
                this.createOptionMenu();
            }
            else if (key.name === 'up' && this.selectIndex > 0) {
                this.selectIndex -= 1;
                this.createOptionMenu();
            }
            else if (key.name === 'return') {
                this.cb?.(this.options[this.selectIndex]);
                input.removeAllListeners('keypress');
                if (firstCallComplete) {
                    output.write('\n');
                }
                else {
                    firstCallComplete = true;
                }
                input.setRawMode(false);
                input.pause();
            }
            else if (key.name === 'escape' || (key.name === 'c' && key.ctrl)) {
                this.close();
            }
        }
    }
    ansiEraseLines(count) {
        //adapted from sindresorhus ansi-escape module
        const ESC = '\u001B[';
        const eraseLine = ESC + '2K';
        const cursorUp = (count = 1) => ESC + count + 'A';
        const cursorLeft = ESC + 'G';
        let clear = '';
        for (let i = 0; i < count; i++) {
            clear += eraseLine + (i < count - 1 ? cursorUp() : '');
        }
        if (count) {
            clear += cursorLeft;
        }
        return clear;
    }
    async init() {
        console.log(this.question);
        readline.emitKeypressEvents(input);
        this.start();
    }
    start() {
        //setup the input for reading
        input.setRawMode(true);
        input.resume();
        input.on('keypress', (event, key) => this.keyPressedHandler(event, key));
        if (this.selectIndex >= 0) {
            this.createOptionMenu();
        }
    }
    getPadding(num = 10) {
        let text = ' ';
        for (let i = 0; i < num; i++) {
            text += ' ';
        }
        return text;
    }
    createOptionMenu() {
        const optionLength = this.options.length;
        if (this.isFirstTimeShowMenu) {
            this.isFirstTimeShowMenu = false;
        }
        else {
            output.write(this.ansiEraseLines(optionLength));
        }
        const padding = this.getPadding(0);
        const cursor = colors.magenta(this.selector);
        for (let i = 0; i < optionLength; i++) {
            const selectedOption = i === this.selectIndex
                ? `${cursor} ${this.options[i]}`
                : `${cursor.replace(/.*/, ' ')} ${this.options[i]}`;
            const ending = i !== optionLength - 1 ? '\n' : '';
            output.write(padding + selectedOption + ending);
        }
    }
}
exports.default = Select;

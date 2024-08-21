"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateControllerSpecContent(name) {
    return `\
// import { describe as context } from '@jest/globals'

describe('${name}', () => {
  it.todo('add a test here to get started building ${name}')
})`;
}
exports.default = generateControllerSpecContent;

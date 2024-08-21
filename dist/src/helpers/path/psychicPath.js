"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const psychic_application_1 = __importDefault(require("../../psychic-application"));
function default_1(dreamPathType) {
    const psychicApp = psychic_application_1.default.getOrFail();
    switch (dreamPathType) {
        case 'controllers':
            return psychicApp.paths.controllers;
        case 'controllerSpecs':
            return psychicApp.paths.controllerSpecs;
        default:
            return (0, dream_1.dreamPath)(dreamPathType);
    }
}
exports.default = default_1;

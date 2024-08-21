"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.psychicPathTypeRelativePath = void 0;
const dream_1 = require("@rvohealth/dream");
const psychic_support_helpers_1 = require("@rvohealth/dream/psychic-support-helpers");
const psychicPath_1 = __importDefault(require("./psychicPath"));
function default_1(originDreamPathType, destinationDreamPathType, fullyQualifiedOriginModelName, fullyQualifiedDestinationModelName = fullyQualifiedOriginModelName) {
    fullyQualifiedOriginModelName = (0, psychic_support_helpers_1.standardizeFullyQualifiedModelName)(fullyQualifiedOriginModelName);
    fullyQualifiedDestinationModelName = (0, dream_1.pascalize)(fullyQualifiedDestinationModelName);
    let pathToRemove = fullyQualifiedOriginModelName;
    if (originDreamPathType === destinationDreamPathType) {
        const sharedPrefixLength = (0, psychic_support_helpers_1.sharedPathPrefix)(fullyQualifiedOriginModelName, fullyQualifiedDestinationModelName).length;
        pathToRemove = fullyQualifiedOriginModelName.slice(sharedPrefixLength);
        fullyQualifiedDestinationModelName = fullyQualifiedDestinationModelName.slice(sharedPrefixLength);
    }
    const numAdditionalUpdirs = pathToRemove.split('/').length - 1;
    let additionalUpdirs = '';
    for (let i = 0; i < numAdditionalUpdirs; i++) {
        additionalUpdirs = `../${additionalUpdirs}`;
    }
    const baseRelativePath = psychicPathTypeRelativePath(originDreamPathType, destinationDreamPathType);
    let destinationPath = additionalUpdirs + (baseRelativePath.length ? baseRelativePath + '/' : '');
    if (destinationPath[0] !== '.')
        destinationPath = `./${destinationPath}`;
    switch (destinationDreamPathType) {
        case 'db':
            return destinationPath;
        case 'factories':
            return `${destinationPath}${fullyQualifiedDestinationModelName}Factory`;
        case 'serializers':
            return `${destinationPath}${fullyQualifiedDestinationModelName}Serializer`;
        default:
            return `${destinationPath}${fullyQualifiedDestinationModelName}`;
    }
}
exports.default = default_1;
function psychicPathTypeRelativePath(originDreamPathType, destinationDreamPathType) {
    const originPath = (0, psychicPath_1.default)(originDreamPathType);
    const destinationPath = (0, psychicPath_1.default)(destinationDreamPathType);
    const sharedPrefixLength = (0, psychic_support_helpers_1.sharedPathPrefix)(originPath, destinationPath).length;
    const originPathToRemove = originPath.slice(sharedPrefixLength);
    const updirs = originPathToRemove.length === 0
        ? ''
        : originPathToRemove
            .split('/')
            .map(() => '../')
            .join('');
    return updirs + destinationPath.slice(sharedPrefixLength);
}
exports.psychicPathTypeRelativePath = psychicPathTypeRelativePath;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParamValidationError = void 0;
const dream_1 = require("@rvohealth/dream");
const luxon_1 = require("luxon");
const isUuid_1 = __importDefault(require("../helpers/isUuid"));
const typechecks_1 = require("../helpers/typechecks");
class Params {
    /**
     * ### .for
     *
     * given an object with key value pairs, it will validate
     * each field based on the underlying schema of the passed dream model class
     *
     * ```ts
     *
     * // from within your controller...
     *
     * // raise error if not matching attributes for User model
     * const params = Params.for(this.params.user, User)
     * ```
     */
    static for(params, dreamClass, forOpts = {}) {
        const { array = false, only } = forOpts;
        if (!dreamClass?.isDream)
            throw new Error(`Params.for must receive a dream class as it's second argument`);
        if (array) {
            if (!Array.isArray(params))
                throw new Error(`Params.for was expecting a top-level array. got ${typeof params}`);
            return params.map(param => this.for(param, dreamClass, { ...forOpts, array: undefined }));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const schema = dreamClass.prototype.schema;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const columns = schema[dreamClass.prototype.table]?.columns;
        const returnObj = {};
        const errors = {};
        const paramSafeColumns = only
            ? dreamClass.paramSafeColumnsOrFallback().filter(column => only.includes(column))
            : dreamClass.paramSafeColumnsOrFallback();
        for (const columnName of paramSafeColumns) {
            if (params[columnName] === undefined)
                continue;
            const columnMetadata = columns[columnName];
            try {
                switch (columnMetadata?.dbType) {
                    case 'bigint':
                    case 'bigint[]':
                    case 'boolean':
                    case 'boolean[]':
                    case 'date':
                    case 'date[]':
                    case 'integer':
                    case 'integer[]':
                    case 'uuid':
                    case 'uuid[]':
                    case 'json':
                    case 'json[]':
                        returnObj[columnName] = this.cast(params[columnName], columnMetadata.dbType, { allowNull: columnMetadata.allowNull });
                        break;
                    case 'character varying':
                    case 'citext':
                    case 'text':
                        returnObj[columnName] = this.cast(params[columnName], 'string', { allowNull: columnMetadata.allowNull });
                        break;
                    case 'character varying[]':
                    case 'citext[]':
                    case 'text[]':
                        returnObj[columnName] = this.cast(params[columnName], 'string[]', {
                            allowNull: columnMetadata.allowNull,
                        });
                        break;
                    case 'timestamp':
                    case 'timestamp with time zone':
                    case 'timestamp without time zone':
                        returnObj[columnName] = this.cast(params[columnName], 'datetime', { allowNull: columnMetadata.allowNull });
                        break;
                    case 'timestamp[]':
                    case 'timestamp with time zone[]':
                    case 'timestamp without time zone[]':
                        returnObj[columnName] = this.cast(params[columnName], 'datetime[]', { allowNull: columnMetadata.allowNull });
                        break;
                    case 'jsonb':
                        returnObj[columnName] = this.cast(params[columnName], 'json', { allowNull: columnMetadata.allowNull });
                        break;
                    case 'jsonb[]':
                        returnObj[columnName] = this.cast(params[columnName], 'json[]', { allowNull: columnMetadata.allowNull });
                        break;
                    case 'numeric':
                        returnObj[columnName] = this.cast(params[columnName], 'number', { allowNull: columnMetadata.allowNull });
                        break;
                    case 'numeric[]':
                        returnObj[columnName] = this.cast(params[columnName], 'number[]', { allowNull: columnMetadata.allowNull });
                        break;
                    default:
                        if (dreamClass.isVirtualColumn(columnName))
                            returnObj[columnName] = params[columnName];
                        if (columnMetadata?.enumValues) {
                            const paramValue = params[columnName];
                            if (columnMetadata.isArray) {
                                if (!Array.isArray(paramValue))
                                    returnObj[columnName] = ['expected an array of enum values'];
                                returnObj[columnName] = paramValue.map(p => this.cast(p, 
                                // casting to allow enum handling at lower level
                                'string', {
                                    allowNull: columnMetadata.allowNull,
                                    enum: columnMetadata.enumValues,
                                }));
                            }
                            else {
                                returnObj[columnName] = this.cast(paramValue, 
                                // casting to allow enum handling at lower level
                                'string', 
                                // columnMetadata.dbType as (typeof PsychicParamsPrimitiveLiterals)[number],
                                {
                                    allowNull: columnMetadata.allowNull,
                                    enum: columnMetadata.enumValues,
                                });
                            }
                        }
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    errors[columnName] = [err.message];
                }
                else {
                    throw err;
                }
            }
        }
        if (Object.keys(errors).length) {
            throw new ParamValidationError(JSON.stringify(errors, null, 2));
        }
        return returnObj;
    }
    static restrict(params, allowed) {
        return new this().restrict(params, allowed);
    }
    /**
     * ### .cast
     *
     * Returns the param requested if it passes validation
     * for the type specified. If the param is not of the type
     * specified, an error is raised.
     *
     * ```ts
     *
     * // from within your controller...
     *
     * // raise error if not string
     * Params.cast(this.params.id, 'string')
     *
     * // raise error if not number
     * Params.cast(this.params.amount, 'number')
     *
     * // raise error if not array of integers
     * Params.cast(this.params.amounts, 'integer[]')
     *
     * // raise error if not 'chalupas' or 'other'
     * Params.cast(this.params.stuff, 'string', { enum: ['chalupas', 'other'] })
     * ```
     */
    static cast(param, expectedType, opts) {
        return new this().cast(param, expectedType, opts);
    }
    static casing(casing) {
        return new this().casing(casing);
    }
    constructor() {
        this._casing = null;
    }
    casing(casing) {
        this._casing = casing;
        return this;
    }
    cast(paramValue, expectedType, opts) {
        if (expectedType instanceof RegExp) {
            return this.matchRegexOrThrow(paramValue, expectedType, opts);
        }
        let errorMessage;
        let baseType;
        let dateClass;
        let compactedValue;
        switch (expectedType) {
            case 'string':
                if (typeof paramValue !== 'string')
                    this.throwUnlessAllowNull(paramValue, 'expected string', opts);
                if (opts?.enum && !opts.enum.includes(paramValue))
                    this.throwUnlessAllowNull(paramValue, 'did not match expected enum values');
                if (opts?.match) {
                    return this.matchRegexOrThrow(paramValue, opts.match, opts);
                }
                else {
                    return paramValue;
                }
            case 'bigint':
                if (!Number.isInteger(parseInt(paramValue)) ||
                    `${parseInt(paramValue)}` !== `${paramValue}`)
                    this.throwUnlessAllowNull(paramValue, 'expected bigint', opts);
                return (paramValue ? `${paramValue}` : null);
            case 'boolean':
                if (paramValue === 'true')
                    return true;
                if (paramValue === 'false')
                    return false;
                if ([1, '1'].includes(paramValue))
                    return true;
                if ([0, '0'].includes(paramValue))
                    return false;
                if (typeof paramValue !== 'boolean')
                    this.throwUnlessAllowNull(paramValue, 'expected boolean', opts);
                return paramValue;
            case 'datetime':
            case 'date':
                switch (expectedType) {
                    case 'datetime':
                        dateClass = luxon_1.DateTime;
                        break;
                    case 'date':
                        dateClass = dream_1.CalendarDate;
                        break;
                    default:
                        if (typeof expectedType === 'string')
                            throw Error(`${expectedType} must be "datetime" or "date"`);
                        else
                            throw Error(`expectedType is not a string`);
                }
                errorMessage = 'expecting ISO string or millis since epoch';
                if ((paramValue instanceof luxon_1.DateTime || paramValue instanceof dream_1.CalendarDate) && paramValue.isValid)
                    return paramValue;
                if (typeof paramValue === 'string') {
                    const dateTime = dateClass.fromISO(paramValue);
                    if (dateTime.isValid)
                        return dateTime;
                    throw new ParamValidationError(errorMessage);
                }
                else if (Number.isInteger(paramValue)) {
                    const dateTime = luxon_1.DateTime.fromMillis(paramValue);
                    if (dateTime.isValid)
                        return dateTime;
                    throw new ParamValidationError(errorMessage);
                }
                else {
                    if (paramValue === null && opts?.allowNull) {
                        return null;
                    }
                    throw new ParamValidationError(errorMessage);
                }
            case 'integer':
                errorMessage = 'expected integer or string integer';
                if (Number.isInteger(paramValue))
                    return parseInt(paramValue);
                if (Number.isNaN(parseInt(paramValue, 10)))
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                if (`${parseInt(paramValue, 10)}` !== `${paramValue}`)
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                return (paramValue === null ? null : parseInt(paramValue, 10));
            case 'json':
                errorMessage = 'expected an object';
                if (typeof paramValue !== 'object')
                    throw new ParamValidationError(errorMessage);
                if (paramValue === null)
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                return (paramValue === null ? null : paramValue);
            case 'number':
                errorMessage = 'expected number or string number';
                if (typeof paramValue === 'number')
                    return paramValue;
                if (`${parseFloat(paramValue)}` !== `${paramValue}`)
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                if (Number.isNaN(parseFloat(paramValue)))
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                if (paramValue === null)
                    return null;
                if (['number', 'string'].includes(typeof paramValue)) {
                    return parseFloat(paramValue.toString());
                }
                return null;
            case 'null':
                if (paramValue !== null)
                    this.throw('expecting null');
                return null;
            case 'uuid':
                errorMessage = 'expected uuid';
                if (paramValue === null)
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                if (paramValue !== null && !(0, isUuid_1.default)(paramValue))
                    throw new ParamValidationError(errorMessage);
                return paramValue;
            case 'bigint[]':
            case 'boolean[]':
            case 'datetime[]':
            case 'date[]':
            case 'integer[]':
            case 'json[]':
            case 'number[]':
            case 'string[]':
            case 'uuid[]':
                baseType = expectedType.replace(/\[\]$/, '');
                errorMessage = `expected ${baseType}[]`;
                if ([undefined, null].includes(paramValue))
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                if (![undefined, null].includes(paramValue) && !Array.isArray(paramValue))
                    throw new ParamValidationError(errorMessage);
                compactedValue = [undefined, null].includes(paramValue)
                    ? paramValue
                    : (0, dream_1.compact)(paramValue);
                return (
                // casting as string[] here because this will actually cause
                // build failures once it is brought into other apps
                ([undefined, null].includes(paramValue)
                    ? paramValue
                    : compactedValue.map(val => this.cast(val, baseType, opts))));
            case 'null[]':
                errorMessage = 'expected null array';
                if (!Array.isArray(paramValue))
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                if (paramValue.length === 0)
                    return [];
                if (paramValue.filter(v => v !== null).length > 0)
                    this.throwUnlessAllowNull(paramValue, errorMessage, opts);
                return paramValue;
            default:
                // TODO: serialize/sanitize before printing, handle array types
                throw new Error(`Unexpected point reached in code. need to handle type for ${expectedType}`);
        }
    }
    restrict(param, allowed) {
        const permitted = {};
        if (param === null || param === undefined)
            return permitted;
        if (!(0, typechecks_1.isObject)(param))
            throw new Error(`Params.restrict expects object or null, received: ${JSON.stringify(param)}`);
        const objectParam = param;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let transformedParams;
        switch (this._casing) {
            case 'snake':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                transformedParams = (0, dream_1.snakeify)(objectParam);
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                transformedParams = (0, dream_1.camelize)(objectParam);
        }
        allowed.forEach(field => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            if (transformedParams?.[field] !== undefined)
                permitted[field] = transformedParams[field];
        });
        return permitted;
    }
    matchRegexOrThrow(paramValue, expectedType, opts) {
        const errorMessage = 'did not match expected pattern';
        if (typeof paramValue !== 'string')
            this.throwUnlessAllowNull(paramValue, errorMessage);
        if (paramValue.length > 1000)
            throw new Error('We do not accept strings over 1000 chars');
        if (expectedType.test(paramValue))
            return paramValue;
        this.throwUnlessAllowNull(paramValue, errorMessage, opts);
        return null;
    }
    throwUnlessAllowNull(paramValue, message, { allowNull = false } = {}) {
        const isNullOrUndefined = [null, undefined].includes(paramValue);
        if (allowNull && isNullOrUndefined)
            return;
        this.throw(message);
    }
    throw(message) {
        throw new ParamValidationError(message);
    }
}
exports.default = Params;
class ParamValidationError extends Error {
}
exports.ParamValidationError = ParamValidationError;

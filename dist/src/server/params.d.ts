import { CalendarDate, Dream, DreamParamSafeAttributes, DreamParamSafeColumnNames } from '@rvohealth/dream';
import { DateTime } from 'luxon';
import { PsychicParamsDictionary, PsychicParamsPrimitive, PsychicParamsPrimitiveLiterals } from '../controller';
export default class Params {
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
    static for<T extends typeof Dream, I extends InstanceType<T>, const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[], ForOpts extends ParamsForOpts<OnlyArray>, ParamSafeColumnsOverride extends I['paramSafeColumns' & keyof I] extends never ? undefined : I['paramSafeColumns' & keyof I] & string[], ParamSafeColumns extends ParamSafeColumnsOverride extends string[] | Readonly<string[]> ? Extract<DreamParamSafeColumnNames<I>, ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>>[] : DreamParamSafeColumnNames<I>[], ReturnPartialType extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<InstanceType<T>>)[] ? Partial<{
        [K in Extract<ParamSafeColumns[number], ForOpts['only'][number & keyof ForOpts['only']]>]: DreamParamSafeAttributes<InstanceType<T>>[K];
    }> : Partial<{
        [K in ParamSafeColumns[number & keyof ParamSafeColumns] & string]: DreamParamSafeAttributes<InstanceType<T>>[K & keyof DreamParamSafeAttributes<InstanceType<T>>];
    }>, ReturnPayload extends ForOpts['array'] extends true ? ReturnPartialType[] : ReturnPartialType>(params: object, dreamClass: T, forOpts?: ForOpts): ReturnPayload;
    static restrict<T extends typeof Params>(this: T, params: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[], allowed: string[]): PsychicParamsDictionary;
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
    static cast<const EnumType extends readonly string[], OptsType extends ParamsCastOptions<EnumType>, ExpectedType extends (typeof PsychicParamsPrimitiveLiterals)[number] | (typeof PsychicParamsPrimitiveLiterals)[number][] | RegExp, ValidatedType extends ValidatedReturnType<ExpectedType>, AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>, FinalReturnType extends AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType>(param: PsychicParamsPrimitive, expectedType: ExpectedType, opts?: OptsType): FinalReturnType;
    static casing<T extends typeof Params>(this: T, casing: 'snake' | 'camel'): Params;
    private _casing;
    constructor();
    casing(casing: 'snake' | 'camel'): this;
    cast<EnumType extends readonly string[], OptsType extends ParamsCastOptions<EnumType>, ExpectedType extends (typeof PsychicParamsPrimitiveLiterals)[number] | (typeof PsychicParamsPrimitiveLiterals)[number][] | RegExp, ValidatedType extends ValidatedReturnType<ExpectedType>, AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>, ReturnType extends AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType>(paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[], expectedType: ExpectedType, opts?: OptsType): AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType;
    restrict(param: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[], allowed: string[]): PsychicParamsDictionary;
    private matchRegexOrThrow;
    private throwUnlessAllowNull;
    private throw;
}
export declare class ParamValidationError extends Error {
}
export type ValidatedReturnType<ExpectedType> = ExpectedType extends RegExp ? string : ExpectedType extends 'string' ? string : ExpectedType extends 'number' ? number : ExpectedType extends 'datetime' ? DateTime : ExpectedType extends 'date' ? CalendarDate : ExpectedType extends 'bigint' ? string : ExpectedType extends 'integer' ? number : ExpectedType extends 'json' ? object : ExpectedType extends 'boolean' ? boolean : ExpectedType extends 'null' ? null : ExpectedType extends 'uuid' ? string : ExpectedType extends 'datetime[]' ? DateTime[] : ExpectedType extends 'date[]' ? CalendarDate[] : ExpectedType extends 'string[]' ? string[] : ExpectedType extends 'bigint[]' ? string[] : ExpectedType extends 'number[]' ? number[] : ExpectedType extends 'integer[]' ? number[] : ExpectedType extends 'boolean[]' ? boolean : ExpectedType extends 'null[]' ? null[] : ExpectedType extends 'uuid[]' ? string[] : ExpectedType extends {
    enum: infer EnumValue;
} ? EnumValue : never;
export type ValidatedAllowsNull<ExpectedType, OptsValue> = ExpectedType extends {
    allowNull: infer R;
} ? R extends true ? true : R extends false ? false : never : OptsValue extends {
    allowNull: infer RR;
} ? RR extends true ? true : RR extends false ? false : never : false;
export type ParamsCastOptions<EnumType> = {
    allowNull?: boolean;
    match?: RegExp;
    enum?: EnumType;
};
export interface ParamsForOpts<OnlyArray> {
    array?: boolean;
    only?: OnlyArray;
}

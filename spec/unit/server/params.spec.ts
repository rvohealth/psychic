import { CalendarDate, ClockTime, ClockTimeTz, DateTime } from '@rvoh/dream'
import { PsychicParamsDictionary } from '../../../src/controller/index.js'
import ParamValidationError from '../../../src/error/controller/ParamValidationError.js'
import ParamValidationErrors from '../../../src/error/controller/ParamValidationErrors.js'
import DeclaredShapeDoesNotCompile from '../../../src/error/openapi/DeclaredShapeDoesNotCompile.js'
import * as ValidateOpenApiSchemaModule from '../../../src/helpers/validateOpenApiSchema.js'
import type {
  JSONColumnShapeStatement,
  VirtualAttributeStatement,
} from '../../../src/openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import Params, { compileDeclaredShapeValidators } from '../../../src/server/params.js'
import Availability from '../../../test-app/src/app/models/Availability.js'
import Pet from '../../../test-app/src/app/models/Pet.js'
import User from '../../../test-app/src/app/models/User.js'

const TestEnumValues = ['hello', 'world'] as const
type TestEnum = (typeof TestEnumValues)[number]

function paramErrorsFrom(fn: () => unknown) {
  try {
    fn()
  } catch (err) {
    if (err instanceof ParamValidationErrors) return err.errors
    throw err
  }
  throw new Error('expected ParamValidationErrors to be thrown')
}

describe('Params', () => {
  describe('.for', () => {
    context('erroring', () => {
      it('raises an exception containing a payload which tells us of all invalid values', () => {
        let error: ParamValidationErrors
        try {
          Params.for({ species: 'invalid', name: 123 }, Pet)
        } catch (err) {
          error = err as ParamValidationErrors
        }

        expect(error!.errors).toEqual({
          name: ['expected string'],
          species: ['did not match expected enum values'],
        })
      })
    })

    context('paramSafeColumns is overridden at the model level', () => {
      class User2 extends User {
        public get paramSafeColumns() {
          return ['email'] as const
        }
      }

      it('respects override', () => {
        expect(Params.for({ email: 'how', password: 'yadoin' }, User2)).toEqual({
          email: 'how',
        })
      })

      context('some of the params given are invalid', () => {
        class User3 extends User {
          public get paramSafeColumns() {
            return ['email', 'birthdate', 'id', 'createdAt'] as const
          }
        }

        it('omits invalid params', () => {
          const now = CalendarDate.today()
          expect(Params.for({ email: 'how', password: 'yadoin', birthdate: now }, User3)).toEqual({
            email: 'how',
            birthdate: expect.toEqualCalendarDate(now),
          })
        })
      })
    })

    context('virtual attributes', () => {
      it('permits virtual attributes', () => {
        expect(Params.for({ email: 'how', password: 'yadoin' }, User)).toEqual({
          email: 'how',
          password: 'yadoin',
        })
      })

      it('validates virtual attributes against their OpenAPI shape', () => {
        expect(() => Params.for({ password: 123 }, User)).toThrow(ParamValidationErrors)
      })

      it('permits null for nullable virtual attributes', () => {
        expect(Params.for({ password: null }, User)).toEqual({ password: null })
      })

      it('validates virtual array attributes against their OpenAPI shape', () => {
        expect(Params.for({ openapiVirtualSpecTest2: ['howdy'] }, User)).toEqual({
          openapiVirtualSpecTest2: ['howdy'],
        })
      })

      it('rejects a bare value for an array-typed virtual attribute, rather than wrapping it', () => {
        expect(paramErrorsFrom(() => Params.for({ openapiVirtualSpecTest2: 'howdy' }, User))).toEqual({
          openapiVirtualSpecTest2: ['expected string array'],
        })
      })

      context('declared shapes beyond a primitive', () => {
        // declared on a subclass, as @deco.Virtual registers them
        class UserWithShapedVirtuals extends User {}
        ;(
          UserWithShapedVirtuals as unknown as { virtualAttributes: VirtualAttributeStatement[] }
        ).virtualAttributes = [
          ...(User['virtualAttributes'] as VirtualAttributeStatement[]),
          {
            property: 'objectVirtual',
            type: {
              type: 'object',
              properties: { a: 'integer', nested: { type: 'object', properties: { b: 'string' } } },
              required: ['a'],
            },
          },
          {
            property: 'nullableObjectVirtual',
            type: { type: ['object', 'null'], properties: { a: 'integer' } },
          },
          {
            property: 'objectArrayVirtual',
            type: { type: 'array', items: { type: 'object', properties: { a: 'integer' }, required: ['a'] } },
          },
          { property: 'enumVirtual', type: { type: 'string', enum: ['red', 'green'] } },
          {
            property: 'enumArrayVirtual',
            type: { type: 'array', items: { type: 'string', enum: ['red', 'green'] } },
          },
          { property: 'booleanVirtual', type: 'boolean' },
          { property: 'integerVirtual', type: 'integer' },
          { property: 'jsonVirtual', type: 'json' },
        ]

        it('returns a matching object as submitted', () => {
          const objectVirtual = { a: 1, nested: { b: 'x' }, extra: true }
          const result: Record<string, unknown> = Params.for({ objectVirtual }, UserWithShapedVirtuals)
          expect(result).toEqual({ objectVirtual })
          expect(result['objectVirtual']).toBe(objectVirtual)
        })

        it('rejects an object missing a required property', () => {
          expect(paramErrorsFrom(() => Params.for({ objectVirtual: {} }, UserWithShapedVirtuals))).toEqual({
            objectVirtual: ["must have required property 'a'"],
          })
        })

        it('rejects a wrong nested type, without coercing it', () => {
          expect(
            paramErrorsFrom(() =>
              Params.for({ objectVirtual: { a: 1, nested: { b: 2 } } }, UserWithShapedVirtuals),
            ),
          ).toEqual({ objectVirtual: ['/nested/b must be string'] })

          expect(() => Params.for({ objectVirtual: { a: '1' } }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
        })

        it('rejects a non-object', () => {
          expect(() => Params.for({ objectVirtual: '{"a":1}' }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
          expect(() => Params.for({ objectVirtual: [{ a: 1 }] }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
        })

        it('permits null only when the declared shape allows it', () => {
          expect(() => Params.for({ objectVirtual: null }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
          expect(Params.for({ nullableObjectVirtual: null }, UserWithShapedVirtuals)).toEqual({
            nullableObjectVirtual: null,
          })
        })

        it('checks each element of a declared array of objects', () => {
          expect(Params.for({ objectArrayVirtual: [{ a: 1 }] }, UserWithShapedVirtuals)).toEqual({
            objectArrayVirtual: [{ a: 1 }],
          })
          expect(() => Params.for({ objectArrayVirtual: [{ a: 1 }, {}] }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
          expect(() => Params.for({ objectArrayVirtual: { a: 1 } }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
        })

        it('checks a declared enum after the cast', () => {
          expect(Params.for({ enumVirtual: 'red' }, UserWithShapedVirtuals)).toEqual({ enumVirtual: 'red' })
          expect(paramErrorsFrom(() => Params.for({ enumVirtual: 'blue' }, UserWithShapedVirtuals))).toEqual({
            enumVirtual: ['did not match expected enum values'],
          })
        })

        it('checks a declared enum on each element of an array', () => {
          expect(Params.for({ enumArrayVirtual: ['red', 'green'] }, UserWithShapedVirtuals)).toEqual({
            enumArrayVirtual: ['red', 'green'],
          })
          expect(() => Params.for({ enumArrayVirtual: ['red', 'blue'] }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
          expect(() => Params.for({ enumArrayVirtual: 'red' }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
        })

        it('still casts a primitive as before, so query-string values pass', () => {
          expect(Params.for({ booleanVirtual: 'true', integerVirtual: '5' }, UserWithShapedVirtuals)).toEqual(
            {
              booleanVirtual: true,
              integerVirtual: 5,
            },
          )
          expect(() => Params.for({ integerVirtual: 'five' }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
        })

        it('accepts any object for a `json` shorthand, and rejects a non-object', () => {
          expect(Params.for({ jsonVirtual: { anything: [1] } }, UserWithShapedVirtuals)).toEqual({
            jsonVirtual: { anything: [1] },
          })
          expect(() => Params.for({ jsonVirtual: 'abc' }, UserWithShapedVirtuals)).toThrow(
            ParamValidationErrors,
          )
        })
      })
    })

    context('a column whose shape the model declares with @deco.JSON', () => {
      // test-app/src/app/models/User.ts declares requiredJsonbData as
      // { theme: 'light' | 'dark', fontSize: integer }, and each
      // element of requiredFavoriteJsonbs as { label: string (required), score: number }

      it('returns a matching value as submitted, extra keys included', () => {
        const requiredJsonbData = { theme: 'dark', fontSize: 12, extra: 'kept' }
        const result = Params.for({ requiredJsonbData }, User)
        expect(result).toEqual({ requiredJsonbData })
        expect(result.requiredJsonbData).toBe(requiredJsonbData)
      })

      it('rejects a value missing a required property', () => {
        expect(paramErrorsFrom(() => Params.for({ requiredFavoriteJsonbs: [{ score: 1 }] }, User))).toEqual({
          requiredFavoriteJsonbs: ["/0 must have required property 'label'"],
        })
      })

      it('rejects a wrong nested type, without coercing it', () => {
        expect(
          paramErrorsFrom(() => Params.for({ requiredJsonbData: { theme: 'dark', fontSize: '12' } }, User)),
        ).toEqual({ requiredJsonbData: ['/fontSize must be integer'] })
      })

      it('rejects a value outside a declared enum', () => {
        expect(paramErrorsFrom(() => Params.for({ requiredJsonbData: { theme: 'blue' } }, User))).toEqual({
          requiredJsonbData: ['/theme must be equal to one of the allowed values'],
        })
      })

      it('rejects a value of the wrong type', () => {
        expect(() => Params.for({ requiredJsonbData: 'dark' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ requiredJsonbData: [{ theme: 'dark' }] }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null for a column that does not allow null', () => {
        expect(() => Params.for({ requiredJsonbData: null }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ requiredFavoriteJsonbs: null }, User)).toThrow(ParamValidationErrors)
      })

      it('checks each element of an array column against the declared element shape', () => {
        expect(
          Params.for({ requiredFavoriteJsonbs: [{ label: 'a' }, { label: 'b', score: 1.5 }] }, User),
        ).toEqual({
          requiredFavoriteJsonbs: [{ label: 'a' }, { label: 'b', score: 1.5 }],
        })
        expect(
          paramErrorsFrom(() => Params.for({ requiredFavoriteJsonbs: [{ label: 'a' }, { score: 1 }] }, User)),
        ).toEqual({ requiredFavoriteJsonbs: ["/1 must have required property 'label'"] })
      })

      it('rejects a bare element for an array column, rather than wrapping it', () => {
        expect(() => Params.for({ requiredFavoriteJsonbs: { label: 'a' } }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('reports declared-shape errors alongside other invalid params', () => {
        expect(
          paramErrorsFrom(() => Params.for({ requiredJsonbData: { fontSize: 1.5 }, email: 123 }, User)),
        ).toEqual({
          email: ['expected string'],
          requiredJsonbData: ['/fontSize must be integer'],
        })
      })

      context('declarations the test-app does not make', () => {
        // declared on a subclass, as @deco.JSON registers them
        class UserWithMoreJSONColumns extends User {}
        ;(
          UserWithMoreJSONColumns as unknown as { jsonColumnShapes: JSONColumnShapeStatement[] }
        ).jsonColumnShapes = [
          { column: 'jsonbData', openapi: { type: 'object', properties: { hello: 'string' } } },
          { column: 'favoriteJsonbs', openapi: { type: 'object', properties: { hello: 'string' } } },
          // shapes that admit a string, which Dream refuses at boot; set here
          // directly, as a declaration that got past that refusal would be
          { column: 'jsonData', openapi: { anyOf: [{ type: 'object' }, { type: 'string' }] } },
          { column: 'favoriteJsons', openapi: { anyOf: [{ type: 'object' }, { type: 'string' }] } },
          {
            column: 'requiredJsonData',
            // `default` is not in Dream's shorthand types; a declaration that
            // carries one anyway (via `as`, or plain JavaScript) still gets none injected
            openapi: {
              type: 'object',
              properties: { withDefault: { type: 'string', default: 'injected' } },
            } as unknown as JSONColumnShapeStatement['openapi'],
          },
        ]

        it('permits null for a nullable column', () => {
          expect(Params.for({ jsonbData: null, favoriteJsonbs: null }, UserWithMoreJSONColumns)).toEqual({
            jsonbData: null,
            favoriteJsonbs: null,
          })
        })

        // Dream stores a string for a json column as raw JSON text, so a
        // string is refused even when the declaration admits one
        it.each([
          ['a string', 'just a string'],
          ['JSON text', '{"admin":true}'],
        ])('rejects %s, though the declaration admits a string', (_, jsonData) => {
          expect(paramErrorsFrom(() => Params.for({ jsonData }, UserWithMoreJSONColumns))).toEqual({
            jsonData: ['must not be a string (send the JSON value itself, not JSON text)'],
          })
        })

        it('rejects JSON text where the declaration admits only an object', () => {
          expect(
            paramErrorsFrom(() => Params.for({ jsonbData: '{"hello":"world"}' }, UserWithMoreJSONColumns)),
          ).toEqual({
            jsonbData: ['must not be a string (send the JSON value itself, not JSON text)'],
          })
        })

        it('rejects a string element of an array column, though the declaration admits one', () => {
          expect(
            paramErrorsFrom(() =>
              Params.for({ favoriteJsons: [{ hello: 'a' }, '{"admin":true}'] }, UserWithMoreJSONColumns),
            ),
          ).toEqual({
            favoriteJsons: ['/1 must not be a string (send the JSON value itself, not JSON text)'],
          })
        })

        it('returns an object or array of objects as submitted', () => {
          const jsonData = { admin: true }
          const favoriteJsons = [{ hello: 'a' }, { hello: 'b' }]
          const result: Record<string, unknown> = Params.for(
            { jsonData, favoriteJsons },
            UserWithMoreJSONColumns,
          )
          expect(result).toEqual({ jsonData, favoriteJsons })
          expect(result['jsonData']).toBe(jsonData)
          expect(result['favoriteJsons']).toBe(favoriteJsons)
        })

        it('injects no declared defaults', () => {
          const requiredJsonData = {}
          const result: Record<string, unknown> = Params.for({ requiredJsonData }, UserWithMoreJSONColumns)
          expect(result['requiredJsonData']).toBe(requiredJsonData)
          expect(requiredJsonData).toEqual({})
        })
      })

      context('a declared shape AJV cannot compile', () => {
        // PsychicApp.init calls compileDeclaredShapeValidators for every
        // model (spec/unit/psychic-application/declaredShapeBootCompile.spec.ts)
        class UserWithUncompilableShape extends User {}
        ;(
          UserWithUncompilableShape as unknown as { jsonColumnShapes: JSONColumnShapeStatement[] }
        ).jsonColumnShapes = [
          {
            column: 'jsonbData',
            openapi: {
              type: 'object',
              properties: { phone: { type: 'string', pattern: '^\\d{3}\\-\\d{4}$' } },
            },
          },
        ]

        it('is refused by compileDeclaredShapeValidators, naming the model, column and decorator', () => {
          expect(() => compileDeclaredShapeValidators(UserWithUncompilableShape)).toThrow(
            DeclaredShapeDoesNotCompile,
          )
          expect(() => compileDeclaredShapeValidators(UserWithUncompilableShape)).toThrow(
            /UserWithUncompilableShape declares a shape for "jsonbData" with\n@deco\.JSON/,
          )
        })
      })

      context('a declared shape compiled at boot', () => {
        class UserWithBootCompiledShape extends User {}
        ;(
          UserWithBootCompiledShape as unknown as { jsonColumnShapes: JSONColumnShapeStatement[] }
        ).jsonColumnShapes = [
          {
            column: 'jsonbData',
            openapi: {
              type: 'object',
              properties: { phone: { type: 'string', pattern: '^\\d{3}-\\d{4}$' } },
            },
          },
        ]

        it('is validated at a request with the validator built at boot, without compiling another', () => {
          compileDeclaredShapeValidators(UserWithBootCompiledShape)
          const createValidatorSpy = vi.spyOn(ValidateOpenApiSchemaModule, 'createValidator')

          expect(Params.for({ jsonbData: { phone: '555-1234' } }, UserWithBootCompiledShape)).toEqual({
            jsonbData: { phone: '555-1234' },
          })
          expect(
            paramErrorsFrom(() => Params.for({ jsonbData: { phone: '5551234' } }, UserWithBootCompiledShape)),
          ).toEqual({ jsonbData: ['/phone must match pattern "^\\d{3}-\\d{4}$"'] })
          expect(createValidatorSpy).not.toHaveBeenCalled()
        })
      })
    })

    context('@Encrypted attributes', () => {
      it('casts the decorated property from its inferred OpenAPI shape', () => {
        expect(Params.for({ secret: 'shh' }, User)).toEqual({ secret: 'shh' })
      })

      it('permits null when the backing encrypted column allows null', () => {
        expect(Params.for({ secret: null }, User)).toEqual({ secret: null })
      })

      it('rejects values that do not match the inferred OpenAPI shape', () => {
        expect(() => Params.for({ secret: 123 }, User)).toThrow(ParamValidationErrors)
      })

      it('does not extract the encrypted backing column', () => {
        expect(Params.for({ encryptedSecret: 'ciphertext' }, User)).toEqual({})
      })
    })

    context('array option is true', () => {
      it('expects top-level array', () => {
        expect(Params.for([{ id: 123, email: 'how', password: 'yadoin' }], User, { array: true })).toEqual([
          {
            email: 'how',
            password: 'yadoin',
          },
        ])
      })

      context('only is also passed alongside array', () => {
        it('narrows the types to those passed in only', () => {
          expect(
            Params.for([{ id: 123, email: 'how', password: 'yadoin' }], User, {
              array: true,
              only: ['email'],
            }),
          ).toEqual([
            {
              email: 'how',
            },
          ])
        })
      })

      it('returns an empty array for an empty array', () => {
        expect(Params.for([], User, { array: true })).toEqual([])
      })

      // A value that is not an array of objects is a client error, so it is
      // rejected with a 400-style ParamValidationErrors (never a 500), and a
      // single value is never wrapped into an array.
      context('when the value is not an array of objects', () => {
        function paramValidationErrorsFrom(fn: () => unknown) {
          let error: unknown
          try {
            fn()
          } catch (err) {
            error = err
          }

          expect(error).toBeInstanceOf(ParamValidationErrors)
          return error as ParamValidationErrors
        }

        it.each([
          ['an empty object', {}],
          ['a single object', { email: 'how' }],
          ['a string', 'how'],
          ['an object with numeric keys', { '0': { email: 'how' } }],
          ['null', null],
          ['an array containing null', [null]],
          ['an array containing a number', [1]],
          ['an array containing a string', ['how']],
          ['an array containing an array', [[{ email: 'how' }]]],
          ['an array mixing objects and non-objects', [{ email: 'how' }, null]],
        ])('rejects %s', (_, value) => {
          const error = paramValidationErrorsFrom(() => Params.for(value as object, User, { array: true }))
          expect(error.errors).toEqual({ params: ['expected an array of objects'] })
        })

        it('names the error after the key when one is given', () => {
          const error = paramValidationErrorsFrom(() =>
            Params.for({ email: 'how' }, User, { array: true, key: 'users' }),
          )
          expect(error.errors).toEqual({ users: ['expected an array of objects'] })
        })
      })
    })

    context('with only option passed', () => {
      it('restricts attributes to only those passed in the only array', () => {
        const params = Params.for({ id: 123, email: 'how', password: 'yadoin' }, User, {
          only: ['email', 'name'],
        })
        expect(params).toEqual({ email: 'how' })
      })
    })

    context('including option', () => {
      it('is not only disallowed at the type level, but has no effect at the implementation level', () => {
        const params = Params.for({ species: 'cat', userId: '1', id: '123' }, Pet, {
          including: ['userId'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)

        expect(params).toEqual({ species: 'cat' })
      })
    })

    context('enum', () => {
      it('permits values inside the enum', () => {
        expect(Params.for({ species: 'cat' }, Pet)).toEqual({ species: 'cat' })
        expect(Params.for({ species: 'noncat' }, Pet)).toEqual({ species: 'noncat' })
      })

      it('rejects values outside the enum', () => {
        expect(() => Params.for({ species: 'invalid' }, Pet)).toThrow(ParamValidationErrors)

        let error: ParamValidationErrors
        try {
          Params.for({ species: 'invalid' }, Pet)
        } catch (err) {
          error = err as ParamValidationErrors
        }

        expect(error!.errors).toEqual({ species: ['did not match expected enum values'] })
      })

      context('with an enum[]', () => {
        it('expects top-level array', () => {
          expect(Params.for({ favoriteTreats: ['efishy feesh'] }, Pet)).toEqual({
            favoriteTreats: ['efishy feesh'],
          })

          let error: ParamValidationErrors
          try {
            Params.for({ favoriteTreats: ['efishy feeshzzz'] }, Pet)
          } catch (err) {
            error = err as ParamValidationErrors
          }

          expect(error!.errors).toEqual({ favoriteTreats: ['did not match expected enum values'] })
        })

        it('trims enum values before validating', () => {
          expect(Params.for({ favoriteTreats: ['  efishy feesh  ', '\nsnick snowcks\t'] }, Pet)).toEqual({
            favoriteTreats: ['efishy feesh', 'snick snowcks'],
          })
        })

        // A non-array value reaching the array-enum branch is a real error:
        // single-value query arrays are conformed to arrays upstream in
        // conformQueryArrayParamsToOpenapiShape. The branch must reject a bare
        // scalar with a 400-style ParamValidationErrors (never a 500 from
        // calling .map on a non-array).
        context('when a bare scalar is supplied instead of an array', () => {
          it('rejects the scalar with a 400-style ParamValidationErrors (never a 500)', () => {
            expect(() => Params.for({ favoriteTreats: 'efishy feesh' }, Pet)).toThrow(ParamValidationErrors)

            let error: ParamValidationErrors
            try {
              Params.for({ favoriteTreats: 'efishy feesh' }, Pet)
            } catch (err) {
              error = err as ParamValidationErrors
            }

            expect(error!).toBeInstanceOf(ParamValidationErrors)
            expect(error!.errors).toEqual({ favoriteTreats: ['expected an array of enum values'] })
          })

          it('rejects even a scalar that would be a valid enum member', () => {
            expect(() => Params.for({ favoriteTreats: 'efishy feeshzzz' }, Pet)).toThrow(
              ParamValidationErrors,
            )
          })
        })

        context('when null is supplied', () => {
          it('rejects null for a column that does not allow null', () => {
            let error: ParamValidationErrors
            try {
              Params.for({ nonNullFavoriteTreats: null }, Pet)
            } catch (err) {
              error = err as ParamValidationErrors
            }

            expect(error!).toBeInstanceOf(ParamValidationErrors)
            expect(error!.errors).toEqual({ nonNullFavoriteTreats: ['expected an array of enum values'] })
          })

          context('the column allows null', () => {
            it('permits null', () => {
              expect(Params.for({ favoriteTreats: null }, Pet)).toEqual({ favoriteTreats: null })
            })
          })
        })

        // The OpenAPI items schema of an enum array is never nullable, so a
        // null element is rejected whether or not the column allows null.
        context('when an element is null', () => {
          it('rejects a null element for a column that does not allow null', () => {
            expect(() => Params.for({ nonNullFavoriteTreats: [null] }, Pet)).toThrow(ParamValidationErrors)
          })

          it('rejects a null element for a column that allows null', () => {
            let error: ParamValidationErrors
            try {
              Params.for({ favoriteTreats: [null] }, Pet)
            } catch (err) {
              error = err as ParamValidationErrors
            }

            expect(error!).toBeInstanceOf(ParamValidationErrors)
            expect(error!.errors).toEqual({ favoriteTreats: ['expected string'] })
          })

          it('rejects a null element alongside valid elements', () => {
            expect(() => Params.for({ favoriteTreats: ['efishy feesh', null] }, Pet)).toThrow(
              ParamValidationErrors,
            )
          })
        })
      })
    })

    context('bigint', () => {
      it('permits a string integer', () => {
        expect(Params.for({ collarCount: '9999999999999999999999999' }, Pet)).toEqual({
          collarCount: '9999999999999999999999999',
        })
      })

      it('permits a number', () => {
        expect(Params.for({ collarCount: 1 }, Pet)).toEqual({ collarCount: '1' })
      })

      it('rejects a string non-integer', () => {
        expect(() => Params.for({ collarCount: '1.2' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCount: '' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCount: true }, Pet)).toThrow(ParamValidationErrors)

        let error: ParamValidationErrors
        try {
          Params.for({ collarCount: '1.2' }, Pet)
        } catch (err) {
          error = err as ParamValidationErrors
        }

        expect(error!.errors).toEqual({ collarCount: ['expected bigint'] })
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredCollarCount: null }, Pet)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for that field', () => {
          expect(Params.for({ collarCount: null }, Pet)).toEqual({ collarCount: null })
        })
      })
    })

    context('bigint[]', () => {
      it('permits a string integer array', () => {
        expect(Params.for({ favoriteBigints: ['1'] }, User)).toEqual({ favoriteBigints: ['1'] })
      })

      it('permits a number array, but converts to string array', () => {
        expect(Params.for({ favoriteBigints: [1] }, User)).toEqual({ favoriteBigints: ['1'] })
      })

      it('rejects non-integer arrays', () => {
        expect(() => Params.for({ favoriteBigints: ['1.2'] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBigints: [''] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBigints: ['abc'] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBigints: [true] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBigints: [{ data: 'hello' }] }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteBigints: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for that field', () => {
          expect(Params.for({ favoriteBigints: null }, User)).toEqual({ favoriteBigints: null })
        })
      })
    })

    context('boolean', () => {
      it('permits a boolean value', () => {
        expect(Params.for({ likesWalks: true }, Pet)).toEqual({ likesWalks: true })
        expect(Params.for({ likesWalks: false }, Pet)).toEqual({ likesWalks: false })
      })

      it('permits a 0 or 1 value, either as a string or a number', () => {
        expect(Params.for({ likesWalks: 1 }, Pet)).toEqual({ likesWalks: true })
        expect(Params.for({ likesWalks: '1' }, Pet)).toEqual({ likesWalks: true })
        expect(Params.for({ likesWalks: 0 }, Pet)).toEqual({ likesWalks: false })
        expect(Params.for({ likesWalks: '0' }, Pet)).toEqual({ likesWalks: false })
      })

      it('permits a string true or string false', () => {
        expect(Params.for({ likesWalks: 'true' }, Pet)).toEqual({ likesWalks: true })
        expect(Params.for({ likesWalks: 'false' }, Pet)).toEqual({ likesWalks: false })
      })

      it('rejects a non-1-or-0-number', () => {
        expect(() => Params.for({ likesWalks: 3 }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects a string float value', () => {
        expect(() => Params.for({ likesWalks: '1.2' }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects a blank string', () => {
        expect(() => Params.for({ likesWalks: '' }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects a non-blank string', () => {
        expect(() => Params.for({ likesWalks: 'abc' }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ likesTreats: null }, Pet)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ likesWalks: null }, Pet)).toEqual({ likesWalks: null })
        })
      })
    })

    context('boolean[]', () => {
      it('permits a boolean array', () => {
        expect(Params.for({ favoriteBooleans: [true, false] }, User)).toEqual({
          favoriteBooleans: [true, false],
        })
      })

      it('rejects non-boolean arrays', () => {
        expect(() => Params.for({ favoriteBooleans: ['1.2'] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBooleans: [''] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBooleans: ['abc'] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBooleans: [3] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteBooleans: [{ data: 'hello' }] }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteBooleans: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for that field', () => {
          expect(Params.for({ favoriteBooleans: null }, User)).toEqual({ favoriteBooleans: null })
        })
      })
    })

    context('integer', () => {
      it('permits a string integer, but casts it to numerical int', () => {
        expect(Params.for({ collarCountInt: '1' }, Pet)).toEqual({ collarCountInt: 1 })
      })

      it('permits a number', () => {
        expect(Params.for({ collarCountInt: 1 }, Pet)).toEqual({ collarCountInt: 1 })
      })

      it('rejects a non-integer', () => {
        expect(() => Params.for({ collarCountInt: '1.2' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCountInt: 1.2 }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCountInt: '' }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredCollarCountInt: null }, Pet)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ collarCountInt: null }, Pet)).toEqual({ collarCountInt: null })
        })
      })
    })

    context('integer[]', () => {
      it('permits a string integer array', () => {
        expect(Params.for({ favoriteIntegers: ['1'] }, User)).toEqual({ favoriteIntegers: [1] })
      })

      it('permits a number array', () => {
        expect(Params.for({ favoriteIntegers: [1] }, User)).toEqual({ favoriteIntegers: [1] })
      })

      it('rejects a non-integer array', () => {
        expect(() => Params.for({ favoriteIntegers: ['1.2'] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteIntegers: [1.2] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteIntegers: [''] }, User)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteIntegers: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ favoriteIntegers: null }, User)).toEqual({ favoriteIntegers: null })
        })
      })
    })

    context('numeric', () => {
      it('permits a string integer, but casts it to a number', () => {
        expect(Params.for({ collarCountNumeric: '1' }, Pet)).toEqual({ collarCountNumeric: 1 })
      })

      it('permits a number', () => {
        expect(Params.for({ collarCountNumeric: 1 }, Pet)).toEqual({ collarCountNumeric: 1 })
      })

      it('permits a string float value', () => {
        expect(Params.for({ collarCountNumeric: '1.2' }, Pet)).toEqual({ collarCountNumeric: 1.2 })
      })

      it('rejects a non-number', () => {
        expect(() => Params.for({ collarCountNumeric: '' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCountNumeric: 'abc' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCountNumeric: true }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ collarCountNumeric: { hello: 'world' } }, Pet)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredCollarCountNumeric: null }, Pet)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ collarCountNumeric: null }, Pet)).toEqual({ collarCountNumeric: null })
        })
      })
    })

    context('numeric[]', () => {
      it('permits a string integer array', () => {
        expect(Params.for({ favoriteNumerics: ['1'] }, User)).toEqual({ favoriteNumerics: [1] })
      })

      it('permits a number array', () => {
        expect(Params.for({ favoriteNumerics: [1] }, User)).toEqual({ favoriteNumerics: [1] })
      })

      it('permits a string float value array', () => {
        expect(Params.for({ favoriteNumerics: [1.2] }, User)).toEqual({ favoriteNumerics: [1.2] })
        expect(Params.for({ favoriteNumerics: ['1.2'] }, User)).toEqual({ favoriteNumerics: [1.2] })
      })

      it('rejects a non-number array', () => {
        expect(() => Params.for({ favoriteNumerics: [''] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteNumerics: ['abc'] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteNumerics: [true] }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteNumerics: [{ hello: 'world' }] }, User)).toThrow(
          ParamValidationErrors,
        )
        expect(() => Params.for({ favoriteNumerics: '' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteNumerics: 'abc' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteNumerics: true }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ favoriteNumerics: { hello: 'world' } }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteNumerics: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ favoriteNumerics: null }, User)).toEqual({ favoriteNumerics: null })
        })
      })
    })

    const stringScenarios = [
      { dbType: 'character varying', allowNull: ['name', User], notNull: ['email', User] },
      { dbType: 'text', allowNull: ['notes', User], notNull: ['bio', User] },
      { dbType: 'citext', allowNull: ['favoriteCitext', User], notNull: ['requiredFavoriteCitext', User] },
    ] as const

    stringScenarios.forEach(
      ({ dbType, notNull: [notNullField, notNullModel], allowNull: [allowNullField, allowNullModel] }) => {
        context(dbType, () => {
          it('permits a string', () => {
            expect(Params.for({ [notNullField]: 'abc123' }, notNullModel)).toEqual({
              [notNullField]: 'abc123',
            })
          })

          it('permits a blank string', () => {
            expect(Params.for({ [notNullField]: '' }, notNullModel)).toEqual({ [notNullField]: '' })
          })

          it('rejects a number', () => {
            expect(() => Params.for({ [notNullField]: 1.2 }, notNullModel)).toThrow(ParamValidationErrors)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrow(ParamValidationErrors)
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      },
    )

    const stringArrayScenarios = [
      { dbType: 'character varying[]', allowNull: ['nicknames', User], notNull: ['requiredNicknames', User] },
      { dbType: 'text[]', allowNull: ['favoriteTexts', User], notNull: ['requiredFavoriteTexts', User] },
      {
        dbType: 'citext[]',
        allowNull: ['favoriteCitexts', User],
        notNull: ['requiredFavoriteCitexts', User],
      },
    ] as const

    stringArrayScenarios.forEach(
      ({ dbType, notNull: [notNullField, notNullModel], allowNull: [allowNullField, allowNullModel] }) => {
        context(dbType, () => {
          it('permits a string', () => {
            expect(Params.for({ [notNullField]: ['abc123'] }, notNullModel)).toEqual({
              [notNullField]: ['abc123'],
            })
          })

          it('permits a blank string', () => {
            expect(Params.for({ [notNullField]: [''] }, notNullModel)).toEqual({ [notNullField]: [''] })
          })

          it('rejects non-strings', () => {
            expect(() => Params.for({ [notNullField]: 1 }, notNullModel)).toThrow(ParamValidationErrors)
            expect(() => Params.for({ [notNullField]: 1.2 }, notNullModel)).toThrow(ParamValidationErrors)
            expect(() => Params.for({ [notNullField]: true }, notNullModel)).toThrow(ParamValidationErrors)
            expect(() => Params.for({ [notNullField]: [1] }, notNullModel)).toThrow(ParamValidationErrors)
            expect(() => Params.for({ [notNullField]: [1.2] }, notNullModel)).toThrow(ParamValidationErrors)
            expect(() => Params.for({ [notNullField]: [true] }, notNullModel)).toThrow(ParamValidationErrors)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrow(ParamValidationErrors)
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      },
    )

    // the test-app declares requiredJsonbData with @deco.JSON, so the
    // undeclared not-null jsonb path is exercised on a subclass without it
    class UserWithoutJSONDeclarations extends User {}
    ;(
      UserWithoutJSONDeclarations as unknown as { jsonColumnShapes: JSONColumnShapeStatement[] }
    ).jsonColumnShapes = []

    context('array columns', () => {
      it('rejects a bare value, rather than wrapping it into an array', () => {
        expect(paramErrorsFrom(() => Params.for({ nicknames: 'abc' }, User))).toEqual({
          nicknames: ['expected string array'],
        })
        expect(paramErrorsFrom(() => Params.for({ favoriteIntegers: 1 }, User))).toEqual({
          favoriteIntegers: ['expected integer or string integer array'],
        })
        expect(paramErrorsFrom(() => Params.for({ favoriteJsons: { abc: 123 } }, User))).toEqual({
          favoriteJsons: ['expected an object array'],
        })
      })

      it('leaves Params.cast, which names the array type explicitly, wrapping a bare value', () => {
        expect(Params.cast({ tags: 'red' }, 'tags', 'string[]')).toEqual(['red'])
      })
    })

    const jsonScenarios = [
      {
        dbType: 'jsonb',
        allowNull: ['jsonbData', User],
        notNull: ['requiredJsonbData', UserWithoutJSONDeclarations],
      },
      { dbType: 'json', allowNull: ['jsonData', User], notNull: ['requiredJsonData', User] },
    ] as const

    jsonScenarios.forEach(
      ({ dbType, notNull: [notNullField, notNullModel], allowNull: [allowNullField, allowNullModel] }) => {
        context(dbType, () => {
          it('permits an object', () => {
            expect(Params.for({ [notNullField]: { abc: 123 } }, notNullModel)).toEqual({
              [notNullField]: { abc: 123 },
            })
          })

          it('rejects a string', () => {
            expect(() => Params.for({ [notNullField]: 'abc123' }, notNullModel)).toThrow(
              ParamValidationErrors,
            )
          })

          it('rejects a blank string', () => {
            expect(() => Params.for({ [notNullField]: '' }, notNullModel)).toThrow(ParamValidationErrors)
          })

          it('rejects a number', () => {
            expect(() => Params.for({ [notNullField]: 1 }, notNullModel)).toThrow(ParamValidationErrors)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrow(ParamValidationErrors)
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      },
    )

    const jsonArrayScenarios = [
      { dbType: 'jsonb[]', allowNull: ['favoriteJsons', User], notNull: ['requiredFavoriteJsons', User] },
      {
        dbType: 'json[]',
        allowNull: ['favoriteJsons', User],
        notNull: ['requiredFavoriteJsons', User],
      },
    ] as const

    jsonArrayScenarios.forEach(
      ({ dbType, notNull: [notNullField, notNullModel], allowNull: [allowNullField, allowNullModel] }) => {
        context(dbType, () => {
          it('permits an object[]', () => {
            expect(Params.for({ [notNullField]: [{ abc: 123 }] }, notNullModel)).toEqual({
              [notNullField]: [{ abc: 123 }],
            })
          })

          it('rejects a non-object array', () => {
            expect(() => Params.for({ [notNullField]: ['abc123'] }, notNullModel)).toThrow(
              ParamValidationErrors,
            )
            expect(() => Params.for({ [notNullField]: [''] }, notNullModel)).toThrow(ParamValidationErrors)
            expect(() => Params.for({ [notNullField]: [1] }, notNullModel)).toThrow(ParamValidationErrors)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrow(ParamValidationErrors)
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      },
    )

    context('datetime', () => {
      const now = DateTime.now()

      it('permits a datetime', () => {
        expect(Params.for({ lastSeenAt: now }, Pet)).toEqual({ lastSeenAt: now })
      })

      it('permits a valid string representation of a datetime', () => {
        expect(Params.for({ lastSeenAt: now.toISO() }, Pet)).toEqual({
          lastSeenAt: expect.toEqualDateTime(now),
        })
      })

      it('permits a valid string representation of a date', () => {
        expect(Params.for({ lastSeenAt: CalendarDate.fromDateTime(now).toISO() }, Pet)).toEqual({
          lastSeenAt: CalendarDate.fromDateTime(now).toDateTime(),
        })
      })

      it('rejects a string non-datetime', () => {
        expect(() => Params.for({ lastSeenAt: '1.2' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ lastSeenAt: '' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ lastSeenAt: 'abc' }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects strings that represent invalid datetimes', () => {
        expect(() => Params.for({ lastSeenAt: '2025-10-15T24:11:56.846Z' }, Pet)).toThrow(
          ParamValidationErrors,
        )
        expect(() => Params.for({ lastSeenAt: '2023-02-29' }, Pet)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ lastHeardAt: null }, Pet)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ lastSeenAt: null }, Pet)).toEqual({
            lastSeenAt: null,
          })
        })
      })
    })

    context('date', () => {
      const today = CalendarDate.today()

      it('permits a datetime', () => {
        expect(Params.for({ birthdate: today }, User)).toEqual({
          birthdate: today,
        })
      })

      it('permits a valid string representation of a date', () => {
        expect(Params.for({ birthdate: today.toISO() }, User)).toEqual({
          birthdate: expect.toEqualCalendarDate(today),
        })
      })

      it('permits a valid string representation of a datetime', () => {
        expect(Params.for({ birthdate: today.toDateTime().toISO() }, User)).toEqual({
          birthdate: expect.toEqualCalendarDate(today),
        })
      })

      it('rejects a string non-datetime', () => {
        expect(() => Params.for({ birthdate: '1.2' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ birthdate: '' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ birthdate: 'abc' }, User)).toThrow(ParamValidationErrors)
      })

      it('rejects strings that represent invalid dates', () => {
        expect(() => Params.for({ birthdate: '2023-02-29T23:11:56.846Z' }, User)).toThrow(
          ParamValidationErrors,
        )
        expect(() => Params.for({ birthdate: '2023-02-29' }, User)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ createdOn: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ birthdate: null }, User)).toEqual({
            birthdate: null,
          })
        })
      })
    })

    context('time', () => {
      const now = ClockTime.now()

      it('permits a time', () => {
        expect(Params.for({ start: now }, Availability)).toEqual({ start: now })
      })

      it('permits a valid string representation of a time', () => {
        expect(Params.for({ start: now.toISO() }, Availability)).toEqual({
          start: expect.toEqualClockTime(now),
        })
      })

      it('rejects a string non-time', () => {
        expect(() => Params.for({ start: '1.2' }, Availability)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ start: '' }, Availability)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ start: 'abc' }, Availability)).toThrow(ParamValidationErrors)
      })

      it('rejects strings that represent invalid times', () => {
        expect(() => Params.for({ start: '24:11:56.846Z' }, Availability)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ start: null }, Availability)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ end: null }, Availability)).toEqual({
            end: null,
          })
        })
      })
    })

    context('timetz', () => {
      const now = ClockTimeTz.now()

      it('permits a time', () => {
        expect(Params.for({ starttz: now }, Availability)).toEqual({ starttz: now })
      })

      it('permits a valid string representation of a time', () => {
        expect(Params.for({ starttz: now.toISO() }, Availability)).toEqual({
          starttz: expect.toEqualClockTimeTz(now),
        })
      })

      it('rejects a string non-time', () => {
        expect(() => Params.for({ starttz: '1.2' }, Availability)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ starttz: '' }, Availability)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ starttz: 'abc' }, Availability)).toThrow(ParamValidationErrors)
      })

      it('rejects strings that represent invalid times', () => {
        expect(() => Params.for({ starttz: '24:11:56.846Z' }, Availability)).toThrow(ParamValidationErrors)
      })

      it('rejects null', () => {
        expect(() => Params.for({ start: null }, Availability)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ endtz: null }, Availability)).toEqual({
            endtz: null,
          })
        })
      })
    })

    const datetimeArrayScenarios = [
      { dbType: 'date[]', allowNull: ['favoriteDates', User], notNull: ['requiredFavoriteDates', User] },
      {
        dbType: 'timestamp without time zone[]',
        allowNull: ['favoriteDatetimes', User],
        notNull: ['requiredFavoriteDatetimes', User],
      },
    ] as const

    datetimeArrayScenarios.forEach(
      ({ dbType, notNull: [notNullField, notNullModel], allowNull: [allowNullField, allowNullModel] }) => {
        context(dbType, () => {
          const now = DateTime.now()

          it('permits a datetime array', () => {
            expect(Params.for({ [allowNullField]: [now] }, allowNullModel)).toEqual({
              [allowNullField]: [now],
            })
          })

          it('rejects a string non-datetime array', () => {
            expect(() => Params.for({ [allowNullField]: ['1.2'] }, allowNullModel)).toThrow(
              ParamValidationErrors,
            )
            expect(() => Params.for({ [allowNullField]: [''] }, allowNullModel)).toThrow(
              ParamValidationErrors,
            )
            expect(() => Params.for({ [allowNullField]: ['abc'] }, allowNullModel)).toThrow(
              ParamValidationErrors,
            )
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrow(ParamValidationErrors)
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      },
    )

    context('uuid', () => {
      it('permits a uuid', () => {
        expect(Params.for({ uuid: '883b3fc3-70a8-401c-a04a-a14b196ef832' }, User)).toEqual({
          uuid: '883b3fc3-70a8-401c-a04a-a14b196ef832',
        })
      })

      it('permits a UUIDv7', () => {
        expect(Params.for({ uuid: '019b0b19-6fd1-706b-a0c1-58768dee1317' }, User)).toEqual({
          uuid: '019b0b19-6fd1-706b-a0c1-58768dee1317',
        })
      })

      it('rejects non-uuid', () => {
        expect(() => Params.for({ uuid: '883b3fc3-70a8-401c-a04a-a14b196ef83' }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ uuid: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ optionalUuid: null }, User)).toEqual({ optionalUuid: null })
        })
      })
    })

    context('uuid[]', () => {
      it('permits a uuid[]', () => {
        expect(Params.for({ favoriteUuids: ['883b3fc3-70a8-401c-a04a-a14b196ef832'] }, User)).toEqual({
          favoriteUuids: ['883b3fc3-70a8-401c-a04a-a14b196ef832'],
        })
      })

      it('rejects non-uuid[]', () => {
        expect(() => Params.for({ favoriteUuids: ['883b3fc3-70a8-401c-a04a-a14b196ef83'] }, User)).toThrow(
          ParamValidationErrors,
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteUuids: null }, User)).toThrow(ParamValidationErrors)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ favoriteUuids: null }, User)).toEqual({ favoriteUuids: null })
        })
      })
    })
  })

  describe('#cast', () => {
    context('data types', () => {
      context('OpenAPI schemas', () => {
        const shape = {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
          },
          required: ['name'],
        }

        it('validates nullish values against the OpenAPI schema', () => {
          expect(() => Params.cast({ user: null }, 'user', shape)).toThrow(ParamValidationError)
        })
      })

      context('primitive values', () => {
        context('string', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: 'howyadoin' }, 'howyadoin', 'string')).toEqual('howyadoin')
            })
          })

          context('with trailing space characters', () => {
            it('the trailing spaces are trimmed', () => {
              expect(Params.cast({ howyadoin: 'howyadoin     ' }, 'howyadoin', 'string')).toEqual('howyadoin')
            })
          })

          context('with leading space characters', () => {
            it('the leading spaces are trimmed', () => {
              expect(Params.cast({ howyadoin: '     howyadoin' }, 'howyadoin', 'string')).toEqual('howyadoin')
            })
          })

          context('with trailing newline characters', () => {
            it('the trailing newlines are trimmed', () => {
              expect(Params.cast({ howyadoin: 'howyadoin\n\n\n' }, 'howyadoin', 'string')).toEqual(
                'howyadoin',
              )
            })
          })

          context('with leading newline characters', () => {
            it('the leading newlines are trimmed', () => {
              expect(Params.cast({ howyadoin: '\n\n\nhowyadoin' }, 'howyadoin', 'string')).toEqual(
                'howyadoin',
              )
            })
          })

          context('with trailing tab characters', () => {
            it('the trailing tabs are trimmed', () => {
              expect(Params.cast({ howyadoin: 'howyadoin\t\t\t' }, 'howyadoin', 'string')).toEqual(
                'howyadoin',
              )
            })
          })

          context('with leading tab characters', () => {
            it('the leading tabs are trimmed', () => {
              expect(Params.cast({ howyadoin: '\t\t\thowyadoin' }, 'howyadoin', 'string')).toEqual(
                'howyadoin',
              )
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 7 }, 'howyadoin', 'string')).toThrow(ParamValidationError)
            })
          })

          context('with match passed', () => {
            context('with a valid value', () => {
              it('returns the requsted value', () => {
                expect(
                  Params.cast({ howyadoin: 'howyadoin' }, 'howyadoin', 'string', { match: /howya.*/ }),
                ).toEqual('howyadoin')
              })
            })

            context('with an invalid value', () => {
              it('raises a validation exception', () => {
                expect(() =>
                  Params.cast({ howyadoin: 'howyadoin' }, 'howyadoin', 'string', { match: /howya.*zzz/ }),
                ).toThrow(ParamValidationError)
                expect(() =>
                  Params.cast({ howyadoin: 7 }, 'howyadoin', 'string', { match: /howya.*zzz/ }),
                ).toThrow(ParamValidationError)
              })
            })
          })
        })

        context('datetime', () => {
          const now = DateTime.now()

          it('permits a datetime', () => {
            expect(Params.cast({ lastSeenAt: now }, 'lastSeenAt', 'datetime')).toEqualDateTime(now)
          })

          it('permits a valid string representation of a datetime', () => {
            expect(Params.cast({ lastSeenAt: now.toISO() }, 'lastSeenAt', 'datetime')).toEqualDateTime(now)
          })

          it('permits a valid string representation of a date', () => {
            expect(
              Params.cast({ lastSeenAt: CalendarDate.fromDateTime(now).toISO() }, 'lastSeenAt', 'datetime'),
            ).toEqualDateTime(CalendarDate.fromDateTime(now).toDateTime())
          })

          it('rejects a string non-datetime', () => {
            expect(() => Params.cast({ lastSeenAt: '1.2' }, 'lastSeenAt', 'datetime')).toThrow(
              ParamValidationError,
            )
            expect(() => Params.cast({ lastSeenAt: '' }, 'lastSeenAt', 'datetime')).toThrow(
              ParamValidationError,
            )
            expect(() => Params.cast({ lastSeenAt: 'abc' }, 'lastSeenAt', 'datetime')).toThrow(
              ParamValidationError,
            )
          })

          it('rejects strings that represent invalid datetimes', () => {
            expect(() =>
              Params.cast({ lastSeenAt: '2025-10-15T24:11:56.846Z' }, 'lastSeenAt', 'datetime'),
            ).toThrow(ParamValidationError)
            expect(() => Params.cast({ lastSeenAt: '2023-02-29' }, 'lastSeenAt', 'datetime')).toThrow(
              ParamValidationError,
            )
          })

          it('rejects null', () => {
            expect(() => Params.cast({ lastHeardAt: null }, 'lastHeardAt', 'datetime')).toThrow(
              ParamValidationError,
            )
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(
                Params.cast({ lastSeenAt: null }, 'lastSeenAt', 'datetime', { allowNull: true }),
              ).toBeNull()
            })
          })
        })

        context('date', () => {
          const today = CalendarDate.today()

          it('permits a datetime', () => {
            expect(Params.cast({ birthdate: today }, 'birthdate', 'date')).toEqualCalendarDate(today)
          })

          it('permits a valid string representation of a date', () => {
            expect(Params.cast({ birthdate: today.toISO() }, 'birthdate', 'date')).toEqualCalendarDate(today)
          })

          it('permits a valid string representation of a datetime', () => {
            expect(
              Params.cast({ birthdate: today.toDateTime().toISO() }, 'birthdate', 'date'),
            ).toEqualCalendarDate(today)
          })

          it('rejects a string non-datetime', () => {
            expect(() => Params.cast({ birthdate: '1.2' }, 'birthdate', 'date')).toThrow(ParamValidationError)
            expect(() => Params.cast({ birthdate: '' }, 'birthdate', 'date')).toThrow(ParamValidationError)
            expect(() => Params.cast({ birthdate: 'abc' }, 'birthdate', 'date')).toThrow(ParamValidationError)
          })

          it('rejects strings that represent invalid dates', () => {
            expect(() => Params.cast({ birthdate: '2025-10-15T24:11:56.846Z' }, 'birthdate', 'date')).toThrow(
              ParamValidationError,
            )
            expect(() => Params.cast({ birthdate: '2023-02-29' }, 'birthdate', 'date')).toThrow(
              ParamValidationError,
            )
          })

          it('rejects null', () => {
            expect(() => Params.cast({ createdOn: null }, 'createdOn', 'date')).toThrow(ParamValidationError)
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(Params.cast({ birthdate: null }, 'birthdate', 'date', { allowNull: true })).toBeNull()
            })
          })
        })

        context('time', () => {
          const now = ClockTime.now()

          it('permits a time', () => {
            expect(Params.cast({ alarmTime: now }, 'alarmTime', 'time')).toEqualClockTime(now)
          })

          it('permits a valid string representation of a time', () => {
            expect(Params.cast({ alarmTime: now.toISO() }, 'alarmTime', 'time')).toEqualClockTime(now)
          })

          it('rejects a string non-time', () => {
            expect(() => Params.cast({ alarmTime: '1.2' }, 'alarmTime', 'time')).toThrow(ParamValidationError)
            expect(() => Params.cast({ alarmTime: '' }, 'alarmTime', 'time')).toThrow(ParamValidationError)
            expect(() => Params.cast({ alarmTime: 'abc' }, 'alarmTime', 'time')).toThrow(ParamValidationError)
          })

          it('rejects strings that represent invalid times', () => {
            expect(() => Params.cast({ alarmTime: '2025-10-15T24:11:56.846Z' }, 'alarmTime', 'time')).toThrow(
              ParamValidationError,
            )
            expect(() => Params.cast({ alarmTime: '2023-02-29' }, 'alarmTime', 'time')).toThrow(
              ParamValidationError,
            )
          })

          it('rejects null', () => {
            expect(() => Params.cast({ lastHeardAt: null }, 'lastHeardAt', 'time')).toThrow(
              ParamValidationError,
            )
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(Params.cast({ alarmTime: null }, 'alarmTime', 'time', { allowNull: true })).toBeNull()
            })
          })
        })

        context('timetz', () => {
          const now = ClockTimeTz.now()

          it('permits a time', () => {
            expect(Params.cast({ availableAt: now }, 'availableAt', 'timetz')).toEqualClockTimeTz(now)
          })

          it('permits a valid string representation of a time', () => {
            expect(Params.cast({ availableAt: now.toISO() }, 'availableAt', 'timetz')).toEqualClockTimeTz(now)
          })

          it('rejects a string non-time', () => {
            expect(() => Params.cast({ availableAt: '1.2' }, 'availableAt', 'timetz')).toThrow(
              ParamValidationError,
            )
            expect(() => Params.cast({ availableAt: '' }, 'availableAt', 'timetz')).toThrow(
              ParamValidationError,
            )
            expect(() => Params.cast({ availableAt: 'abc' }, 'availableAt', 'timetz')).toThrow(
              ParamValidationError,
            )
          })

          it('rejects strings that represent invalid times', () => {
            expect(() =>
              Params.cast({ availableAt: '2025-10-15T24:11:56.846Z' }, 'availableAt', 'timetz'),
            ).toThrow(ParamValidationError)
            expect(() => Params.cast({ availableAt: '2023-02-29' }, 'availableAt', 'timetz')).toThrow(
              ParamValidationError,
            )
          })

          it('rejects null', () => {
            expect(() => Params.cast({ lastHeardAt: null }, 'lastHeardAt', 'timetz')).toThrow(
              ParamValidationError,
            )
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(
                Params.cast({ availableAt: null }, 'availableAt', 'timetz', { allowNull: true }),
              ).toBeNull()
            })
          })
        })

        context('regex', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: 'howyadoin' }, 'howyadoin', /howya.*/)).toEqual('howyadoin')
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 'howyadoin' }, 'howyadoin', /howya.*zzz/)).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: 7 }, 'howyadoin', /howya.*zzz/)).toThrow(
                ParamValidationError,
              )
            })
          })
        })

        context('number', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: 7 }, 'howyadoin', 'number')).toEqual(7)
              expect(Params.cast({ howyadoin: '7' }, 'howyadoin', 'number')).toEqual(7)
              expect(Params.cast({ howyadoin: '7.1' }, 'howyadoin', 'number')).toEqual(7.1)
              expect(Params.cast({ howyadoin: -7 }, 'howyadoin', 'number')).toEqual(-7)
              expect(Params.cast({ howyadoin: '-7' }, 'howyadoin', 'number')).toEqual(-7)
              expect(Params.cast({ howyadoin: '-7.1' }, 'howyadoin', 'number')).toEqual(-7.1)
              expect(Params.cast({ howyadoin: 7.1234567898765e30 }, 'howyadoin', 'number')).toEqual(
                7.1234567898765e30,
              )
              expect(Params.cast({ howyadoin: '7.1234567898765e30' }, 'howyadoin', 'number')).toEqual(
                7.1234567898765e30,
              )
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 'hello' }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: '777hello' }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
            })
          })

          context('with a non-finite or non-decimal value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 'Infinity' }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: '1e999' }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: '0x10' }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: 'NaN' }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: Infinity }, 'howyadoin', 'number')).toThrow(
                ParamValidationError,
              )
            })
          })

          context('with a pathologically long non-numeric string', () => {
            it('rejects it quickly without catastrophic backtracking', () => {
              const start = Date.now()
              expect(() =>
                Params.cast({ howyadoin: '9'.repeat(100000) + '!' }, 'howyadoin', 'number'),
              ).toThrow(ParamValidationError)
              expect(Date.now() - start).toBeLessThan(1000)
            })
          })
        })

        context('integer', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: 7 }, 'howyadoin', 'integer')).toEqual(7)
              expect(Params.cast({ howyadoin: '7' }, 'howyadoin', 'integer')).toEqual(7)
              expect(Params.cast({ howyadoin: -7 }, 'howyadoin', 'integer')).toEqual(-7)
              expect(Params.cast({ howyadoin: '-7' }, 'howyadoin', 'integer')).toEqual(-7)
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 7.1 }, 'howyadoin', 'integer')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: '0x777' }, 'howyadoin', 'integer')).toThrow(
                ParamValidationError,
              )
            })
          })

          context('with a value outside the safe integer range', () => {
            it('raises a validation exception rather than returning a rounded float', () => {
              // 40-digit string: parseInt would silently round this to a nearby float
              expect(() =>
                Params.cast(
                  { howyadoin: '1234567890123456789012345678901234567890' },
                  'howyadoin',
                  'integer',
                ),
              ).toThrow(ParamValidationError)
            })

            it('handles genuinely large integers losslessly when cast as bigint', () => {
              expect(
                Params.cast({ howyadoin: '1234567890123456789012345678901234567890' }, 'howyadoin', 'bigint'),
              ).toEqual('1234567890123456789012345678901234567890')
            })
          })
        })

        context('bigint', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: '9999999999999999999999999' }, 'howyadoin', 'bigint')).toEqual(
                '9999999999999999999999999',
              )
              expect(Params.cast({ howyadoin: 7 }, 'howyadoin', 'bigint')).toEqual('7')
              expect(Params.cast({ howyadoin: '-9999999999999999999999999' }, 'howyadoin', 'bigint')).toEqual(
                '-9999999999999999999999999',
              )
              expect(Params.cast({ howyadoin: -7 }, 'howyadoin', 'bigint')).toEqual('-7')
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: '9i' }, 'howyadoin', 'bigint')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: 7.1 }, 'howyadoin', 'bigint')).toThrow(
                ParamValidationError,
              )
            })
          })
        })

        context('boolean', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: true }, 'howyadoin', 'boolean')).toEqual(true)
              expect(Params.cast({ howyadoin: false }, 'howyadoin', 'boolean')).toEqual(false)
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 'hello' }, 'howyadoin', 'boolean')).toThrow(
                ParamValidationError,
              )
            })
          })
        })

        context('null', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: null }, 'howyadoin', 'null')).toBeNull()
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: 'hello' }, 'howyadoin', 'null')).toThrow(
                ParamValidationError,
              )
            })
          })
        })

        context('string[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: ['hello', 'world'] }, 'howyadoin', 'string[]')).toEqual([
                'hello',
                'world',
              ])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: ['hello', 1] }, 'howyadoin', 'string[]')).toThrow(
                ParamValidationError,
              )
            })
          })

          it('can correctly find a param, with or without array brackets', () => {
            expect(Params.cast({ 'howyadoin[]': ['hello', 'world'] }, 'howyadoin[]', 'string[]')).toEqual([
              'hello',
              'world',
            ])
            expect(Params.cast({ 'howyadoin[]': ['hello', 'world'] }, 'howyadoin', 'string[]')).toEqual([
              'hello',
              'world',
            ])
            expect(Params.cast({ howyadoin: ['hello', 'world'] }, 'howyadoin[]', 'string[]')).toEqual([
              'hello',
              'world',
            ])
          })

          context('with null', () => {
            it('compacts null and undefined inner values', () => {
              expect(Params.cast({ howyadoin: ['hello', null, undefined] }, 'howyadoin', 'string[]')).toEqual(
                ['hello'],
              )
            })

            it('rejects null or undefined as outer values', () => {
              expect(() => Params.cast({ howyadoin: null }, 'howyadoin', 'string[]')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: undefined }, 'howyadoin', 'string[]')).toThrow(
                ParamValidationError,
              )
            })

            context('null is explicitly allowed', () => {
              it('does not reject null or undefined as outer values', () => {
                expect(
                  Params.cast({ howyadoin: null }, 'howyadoin', 'string[]', { allowNull: true }),
                ).toBeNull()
                expect(
                  Params.cast({ howyadoin: undefined }, 'howyadoin', 'string[]', { allowNull: true }),
                ).toEqual(undefined)
              })
            })
          })

          context('with match passed', () => {
            context('with a valid value', () => {
              it('returns the requsted value', () => {
                expect(
                  Params.cast({ howyadoin: ['howyadoin', 'howyanotdoin'] }, 'howyadoin', 'string[]', {
                    match: /howya.*/,
                  }),
                ).toEqual(['howyadoin', 'howyanotdoin'])
              })
            })

            context('with an invalid value', () => {
              it('raises a validation exception', () => {
                expect(() =>
                  Params.cast({ howyadoin: ['howyadoin', 'howyadoinzzz'] }, 'howyadoin', 'string[]', {
                    match: /howya.*zzz/,
                  }),
                ).toThrow(ParamValidationError)
                expect(() =>
                  Params.cast({ howyadoin: [1, 'howyadoinzzz'] }, 'howyadoin', 'string[]', {
                    match: /howya.*zzz/,
                  }),
                ).toThrow(ParamValidationError)
              })
            })
          })

          context('with enum passed', () => {
            it('trims values before validating against the enum', () => {
              const result: TestEnum[] = Params.cast(
                { howyadoin: ['  hello  ', '\nworld\t'] },
                'howyadoin',
                'string[]',
                { enum: TestEnumValues },
              )

              expect(result).toEqual(['hello', 'world'])
            })
          })
        })

        context('number[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: [1, 2.2, '1', '3.3'] }, 'howyadoin', 'number[]')).toEqual([
                1, 2.2, 1, 3.3,
              ])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: ['hello', 1] }, 'howyadoin', 'number[]')).toThrow(
                ParamValidationError,
              )
            })
          })

          it('can correctly find a param with array brackets', () => {
            expect(Params.cast({ 'howyadoin[]': [1, 2] }, 'howyadoin[]', 'number[]')).toEqual([1, 2])
          })

          it('can correctly find a param with array brackets, even when the brackets are left off', () => {
            expect(Params.cast({ 'howyadoin[]': [1, 2] }, 'howyadoin', 'number[]')).toEqual([1, 2])
          })

          context('with null', () => {
            it('compacts null and undefined inner values', () => {
              expect(Params.cast({ howyadoin: [1, null, undefined] }, 'howyadoin', 'number[]')).toEqual([1])
            })

            it('rejects null or undefined as outer values', () => {
              expect(() => Params.cast({ howyadoin: null }, 'howyadoin', 'number[]')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: undefined }, 'howyadoin', 'number[]')).toThrow(
                ParamValidationError,
              )
            })

            context('null is explicitly allowed', () => {
              it('does not reject null or undefined as outer values', () => {
                expect(
                  Params.cast({ howyadoin: null }, 'howyadoin', 'number[]', { allowNull: true }),
                ).toBeNull()
                expect(
                  Params.cast({ howyadoin: undefined }, 'howyadoin', 'number[]', { allowNull: true }),
                ).toEqual(undefined)
              })
            })
          })
        })

        context('integer[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: [1, 2] }, 'howyadoin', 'integer[]')).toEqual([1, 2])
              expect(Params.cast({ howyadoin: ['1', '2'] }, 'howyadoin', 'integer[]')).toEqual([1, 2])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: [1.1, 1] }, 'howyadoin', 'integer[]')).toThrow(
                ParamValidationError,
              )
            })
          })

          it('can correctly find a param with array brackets', () => {
            expect(Params.cast({ 'howyadoin[]': [1, 2] }, 'howyadoin[]', 'integer[]')).toEqual([1, 2])
            expect(Params.cast({ 'howyadoin[]': ['1', '2'] }, 'howyadoin[]', 'integer[]')).toEqual([1, 2])
          })

          it('can correctly find a param with array brackets, even when the brackets are left off', () => {
            expect(Params.cast({ 'howyadoin[]': [1, 2] }, 'howyadoin', 'integer[]')).toEqual([1, 2])
            expect(Params.cast({ 'howyadoin[]': ['1', '2'] }, 'howyadoin', 'integer[]')).toEqual([1, 2])
          })

          context('with null', () => {
            it('compacts null and undefined inner values', () => {
              expect(Params.cast({ howyadoin: [1, null, undefined] }, 'howyadoin', 'integer[]')).toEqual([1])
            })

            it('rejects null or undefined as outer values', () => {
              expect(() => Params.cast({ howyadoin: null }, 'howyadoin', 'integer[]')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: undefined }, 'howyadoin', 'integer[]')).toThrow(
                ParamValidationError,
              )
            })

            context('null is explicitly allowed', () => {
              it('does not reject null or undefined as outer values', () => {
                expect(
                  Params.cast({ howyadoin: null }, 'howyadoin', 'integer[]', { allowNull: true }),
                ).toBeNull()
                expect(
                  Params.cast({ howyadoin: undefined }, 'howyadoin', 'integer[]', { allowNull: true }),
                ).toEqual(undefined)
              })
            })
          })
        })

        context('bigint[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: ['1', '2'] }, 'howyadoin', 'bigint[]')).toEqual(['1', '2'])
              expect(Params.cast({ howyadoin: [1, 2] }, 'howyadoin', 'bigint[]')).toEqual(['1', '2'])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: ['1.1', '1'] }, 'howyadoin', 'bigint[]')).toThrow(
                ParamValidationError,
              )
            })
          })

          it('can correctly find a param with array brackets', () => {
            expect(Params.cast({ 'howyadoin[]': [1, 2] }, 'howyadoin[]', 'bigint[]')).toEqual(['1', '2'])
            expect(Params.cast({ 'howyadoin[]': ['1', '2'] }, 'howyadoin[]', 'bigint[]')).toEqual(['1', '2'])
          })

          it('can correctly find a param with array brackets, even when the brackets are left off', () => {
            expect(Params.cast({ 'howyadoin[]': [1, 2] }, 'howyadoin', 'bigint[]')).toEqual(['1', '2'])
            expect(Params.cast({ 'howyadoin[]': ['1', '2'] }, 'howyadoin', 'bigint[]')).toEqual(['1', '2'])
          })

          context('with null', () => {
            it('compacts null and undefined inner values', () => {
              expect(Params.cast({ howyadoin: ['1', null, undefined] }, 'howyadoin', 'bigint[]')).toEqual([
                '1',
              ])
            })

            it('rejects null or undefined as outer values', () => {
              expect(() => Params.cast({ howyadoin: null }, 'howyadoin', 'bigint[]')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: undefined }, 'howyadoin', 'bigint[]')).toThrow(
                ParamValidationError,
              )
            })

            context('null is explicitly allowed', () => {
              it('does not reject null or undefined as outer values', () => {
                expect(
                  Params.cast({ howyadoin: null }, 'howyadoin', 'bigint[]', { allowNull: true }),
                ).toBeNull()
                expect(
                  Params.cast({ howyadoin: undefined }, 'howyadoin', 'bigint[]', { allowNull: true }),
                ).toEqual(undefined)
              })
            })
          })
        })

        context('boolean[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: [true, false] }, 'howyadoin', 'boolean[]')).toEqual([
                true,
                false,
              ])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: ['hello', true] }, 'howyadoin', 'boolean[]')).toThrow(
                ParamValidationError,
              )
            })
          })

          it('can correctly find a param with array brackets', () => {
            expect(Params.cast({ 'howyadoin[]': [true, false] }, 'howyadoin[]', 'boolean[]')).toEqual([
              true,
              false,
            ])
          })

          it('can correctly find a param with array brackets, even when the brackets are left off', () => {
            expect(Params.cast({ 'howyadoin[]': [true, false] }, 'howyadoin', 'boolean[]')).toEqual([
              true,
              false,
            ])
          })

          context('with null', () => {
            it('compacts null and undefined inner values', () => {
              expect(Params.cast({ howyadoin: [true, null, undefined] }, 'howyadoin', 'boolean[]')).toEqual([
                true,
              ])
            })

            it('rejects null or undefined as outer values', () => {
              expect(() => Params.cast({ howyadoin: null }, 'howyadoin', 'boolean[]')).toThrow(
                ParamValidationError,
              )
              expect(() => Params.cast({ howyadoin: undefined }, 'howyadoin', 'boolean[]')).toThrow(
                ParamValidationError,
              )
            })

            context('null is explicitly allowed', () => {
              it('does not reject null or undefined as outer values', () => {
                expect(
                  Params.cast({ howyadoin: null }, 'howyadoin', 'boolean[]', { allowNull: true }),
                ).toBeNull()
                expect(
                  Params.cast({ howyadoin: undefined }, 'howyadoin', 'boolean[]', { allowNull: true }),
                ).toEqual(undefined)
              })
            })
          })
        })

        context('null[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.cast({ howyadoin: [null, null] }, 'howyadoin', 'null[]')).toEqual([null, null])
            })
          })

          it('can correctly find a param with array brackets', () => {
            expect(Params.cast({ 'howyadoin[]': [null, null] }, 'howyadoin[]', 'null[]')).toEqual([
              null,
              null,
            ])
          })

          it('can correctly find a param with array brackets, even when the brackets are left off', () => {
            expect(Params.cast({ 'howyadoin[]': [null, null] }, 'howyadoin', 'null[]')).toEqual([null, null])
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.cast({ howyadoin: ['hello', null] }, 'howyadoin', 'null[]')).toThrow(
                ParamValidationError,
              )
            })
          })
        })

        context('enum', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              const result: TestEnum = Params.cast({ howyadoin: 'hello' }, 'howyadoin', 'string', {
                enum: TestEnumValues,
              })
              expect(result).toEqual('hello')
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              let error: ParamValidationError
              try {
                Params.cast({ howyadoin: 'goodbye' }, 'howyadoin', 'string', { enum: TestEnumValues })
              } catch (err) {
                error = err as ParamValidationError
              }

              expect(error!.paramName).toEqual('howyadoin')
              expect(error!.errorMessages).toEqual(['did not match expected enum values'])

              expect(() =>
                Params.cast({ howyadoin: 'goodbye' }, 'howyadoin', 'string', { enum: TestEnumValues }),
              ).toThrow(ParamValidationError)
            })
          })
        })
      })
    })
  })

  describe('#restrict', () => {
    it('restricts attributes to only those passed', () => {
      expect(Params.restrict({ name: 'howyadoin', email: 'hello' }, ['name'])).toEqual({ name: 'howyadoin' })
    })

    context('one of the desired attributes is null', () => {
      it('allows null to pass through', () => {
        expect(Params.restrict({ name: null, email: 'hello' }, ['name'])).toEqual({
          name: null,
        })
      })
    })

    context('one of the desired attributes is false', () => {
      it('allows false to pass through', () => {
        expect(Params.restrict({ name: false, email: 'hello' }, ['name'])).toEqual({
          name: false,
        })
      })
    })

    context('one of the desired attributes is undefined', () => {
      it('omits undefined', () => {
        expect(
          Object.keys(
            Params.restrict({ name: undefined as unknown as PsychicParamsDictionary, email: 'hello' }, [
              'name',
            ]),
          ),
        ).toEqual([])
      })
    })
  })

  describe('#casing', () => {
    it('works together with restrict to snakeify attribute keys when ingesting params', () => {
      expect(Params.casing({ HelloWorld: 'HowAreYou' }, 'snake').restrict(['hello_world'])).toEqual({
        hello_world: 'HowAreYou',
      })
    })

    it('works together with restrict to camelize attribute keys when ingesting params', () => {
      expect(Params.casing({ hello_world: 'HowAreYou' }, 'camel').restrict(['helloWorld'])).toEqual({
        helloWorld: 'HowAreYou',
      })
    })
  })
})

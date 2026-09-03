import PsychicController from '../../../src/controller/index.js'
import ParamValidationError from '../../../src/error/controller/ParamValidationError.js'
import Params from '../../../src/server/params.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

const TestEnumValues = ['hello', 'world'] as const
type TestEnum = (typeof TestEnumValues)[number]

describe('PsychicController#castParam', () => {
  let controller: PsychicController

  beforeEach(() => {
    const ctx = createMockKoaContext({
      body: {
        id: 1,
        name: 'howyadoin',
        createdAt: 'hello',
        updatedAt: 'birld',
        deletedAt: 'sometimeago',
        subBody: { hello: 'world', nullValue: null },
        nullSubBody: null,
        dotNotationToArray: ['a'],
        dotNotationToString: 'a',
        hello: 'hello',
        goodbye: 'goodbye',
        helloWorldArray: ['hello', 'world'],
        helloArray: 'hello',
        'helloBracketedArray[]': 'hello',
        'helloWorldBracketedArray[]': ['hello', 'world'],
        helloGoodbyeArray: ['hello', 'goodbye'],
        openapiTest: {
          nested: {
            intTest: '123.0',
            dateTest: '2025-01-01',
          },
        },
      },
    })
    controller = new PsychicController(ctx, { action: 'hello' })
  })

  it('returns the result of Params.cast', () => {
    vi.spyOn(Params, 'cast').mockReturnValue('chalupas dujour')
    expect(controller.castParam('name', 'string', { allowNull: true })).toEqual('chalupas dujour')
  })

  context('arrays', () => {
    context('string[]', () => {
      it('correctly casts valid string array values', () => {
        const results = controller.castParam('helloWorldArray', 'string[]')
        expect(results).toEqual(['hello', 'world'])
      })

      it('can correctly find a param with array brackets', () => {
        const results = controller.castParam('helloWorldBracketedArray[]', 'string[]')
        expect(results).toEqual(['hello', 'world'])
      })

      it('can correctly find a param with array brackets, even when the brackets are left off', () => {
        const results = controller.castParam('helloWorldBracketedArray', 'string[]')
        expect(results).toEqual(['hello', 'world'])
      })

      context('with a single array value', () => {
        it('correctly casts to an array', () => {
          const results1 = controller.castParam('helloArray', 'string[]')
          expect(results1).toEqual(['hello'])

          const results2 = controller.castParam('helloBracketedArray[]', 'string[]')
          expect(results2).toEqual(['hello'])
        })
      })
    })
  })

  it('can traverse dot notation', () => {
    expect(controller.castParam('subBody.hello', 'string')).toEqual('world')
  })

  context('an enum', () => {
    it('allows valid enum values (and type the response)', () => {
      const result: TestEnum = controller.castParam('hello', 'string', { enum: TestEnumValues })
      expect(result).toEqual('hello')
    })

    it("disallows values that aren't allowed by the enum", () => {
      expect(() => controller.castParam('goodbye', 'string', { enum: TestEnumValues })).toThrow(
        ParamValidationError,
      )
    })
  })

  context('an enum array', () => {
    it('allows valid enum values (and type the response)', () => {
      const results: TestEnum[] = controller.castParam('helloWorldArray', 'string[]', {
        enum: TestEnumValues,
      })
      expect(results).toEqual(['hello', 'world'])
    })

    it("disallows values that aren't allowed by the enum", () => {
      expect(() => controller.castParam('helloGoodbyeArray', 'string[]', { enum: TestEnumValues })).toThrow(
        ParamValidationError,
      )
    })
  })

  context('when specifying an invalid type for the nested attribute', () => {
    it('throws ParamValidationError', () => {
      expect(() => controller.castParam('subBody.hello', 'number')).toThrow(ParamValidationError)
    })
  })

  context("when the specified sub-object doesn't exist", () => {
    it('throws ParamValidationError', () => {
      expect(() => controller.castParam('invalidSubBody.hello', 'string')).toThrow(ParamValidationError)
    })
  })

  context('when the specified sub-object is null', () => {
    it('throws ParamValidationError', () => {
      expect(() => controller.castParam('nullSubBody.hello', 'string')).toThrow(ParamValidationError)
    })
  })

  context('when dot notation specifies a non-object', () => {
    it('throws ParamValidationError', () => {
      expect(() => controller.castParam('dotNotationToString.hello', 'string')).toThrow(ParamValidationError)
    })
  })

  context('when dot notation specifies a an array', () => {
    it('throws ParamValidationError', () => {
      expect(() => controller.castParam('dotNotationToArray.hello', 'string')).toThrow(ParamValidationError)
    })
  })

  context('with allowNull', () => {
    it('can traverse dot notation', () => {
      expect(controller.castParam('subBody.hello', 'string', { allowNull: true })).toEqual('world')
    })

    context("when the specified sub-object doesn't exist", () => {
      it('returns undefined', () => {
        expect(controller.castParam('invalidSubBody.hello', 'string', { allowNull: true })).toBeUndefined()
      })
    })

    context('when the nested value is explicitly null', () => {
      it('returns null', () => {
        expect(controller.castParam('subBody.nullValue', 'string', { allowNull: true })).toBeNull()
      })
    })

    context('when the specified sub-object is null', () => {
      it('throws ParamValidationError', () => {
        expect(() => controller.castParam('nullSubBody.hello', 'string', { allowNull: true })).toThrow(
          ParamValidationError,
        )
      })
    })

    context('with a RegExp expected type', () => {
      it('returns undefined when the parameter is absent', () => {
        expect(controller.castParam('code', /^\d{4}$/, { allowNull: true })).toBeUndefined()
      })

      it('returns undefined when a dot-notation intermediate is absent', () => {
        expect(controller.castParam('invalidSubBody.code', /^\d{4}$/, { allowNull: true })).toBeUndefined()
      })

      it('returns null when the parameter is explicitly null', () => {
        expect(controller.castParam('subBody.nullValue', /^\d{4}$/, { allowNull: true })).toBeNull()
      })

      it('throws ParamValidationError when a present value does not match', () => {
        expect(() => controller.castParam('name', /^\d{4}$/, { allowNull: true })).toThrow(
          ParamValidationError,
        )
      })
    })
  })

  context('with a RegExp expected type', () => {
    it('throws ParamValidationError when the parameter is absent', () => {
      expect(() => controller.castParam('code', /^\d{4}$/)).toThrow(ParamValidationError)
    })

    it('throws ParamValidationError when the parameter is explicitly null', () => {
      expect(() => controller.castParam('subBody.nullValue', /^\d{4}$/)).toThrow(ParamValidationError)
    })

    it('returns a present value that matches', () => {
      expect(controller.castParam('name', /^howya/)).toEqual('howyadoin')
    })
  })

  context('string length constraints', () => {
    context('maxLength', () => {
      it('passes when the value is within the maximum length', () => {
        expect(controller.castParam('name', 'string', { maxLength: 10 })).toEqual('howyadoin')
      })

      it('throws ParamValidationError when the value exceeds the maximum length', () => {
        expect(() => controller.castParam('name', 'string', { maxLength: 8 })).toThrow(ParamValidationError)
      })
    })

    context('minLength', () => {
      it('passes when the value meets the minimum length', () => {
        expect(controller.castParam('name', 'string', { minLength: 9 })).toEqual('howyadoin')
      })

      it('throws ParamValidationError when the value is shorter than the minimum length', () => {
        expect(() => controller.castParam('name', 'string', { minLength: 10 })).toThrow(ParamValidationError)
      })
    })

    context('combined with an existing enum option', () => {
      it('applies both constraints', () => {
        expect(controller.castParam('hello', 'string', { enum: TestEnumValues, maxLength: 5 })).toEqual(
          'hello',
        )
        expect(() => controller.castParam('hello', 'string', { enum: TestEnumValues, maxLength: 4 })).toThrow(
          ParamValidationError,
        )
      })
    })

    context('element-wise on a string[] cast', () => {
      it('passes when every element is within the maximum length', () => {
        expect(controller.castParam('helloWorldArray', 'string[]', { maxLength: 5 })).toEqual([
          'hello',
          'world',
        ])
      })

      it('throws ParamValidationError when any element exceeds the maximum length', () => {
        expect(() => controller.castParam('helloWorldArray', 'string[]', { maxLength: 4 })).toThrow(
          ParamValidationError,
        )
      })
    })
  })

  context('numeric range constraints', () => {
    context('integer', () => {
      it('passes when the value is within maximum', () => {
        expect(controller.castParam('id', 'integer', { maximum: 100 })).toEqual(1)
      })

      it('throws ParamValidationError when the value exceeds maximum', () => {
        expect(() => controller.castParam('id', 'integer', { maximum: 0 })).toThrow(ParamValidationError)
      })

      it('passes when the value meets minimum', () => {
        expect(controller.castParam('id', 'integer', { minimum: 1 })).toEqual(1)
      })

      it('throws ParamValidationError when the value is below minimum', () => {
        expect(() => controller.castParam('id', 'integer', { minimum: 5 })).toThrow(ParamValidationError)
      })
    })

    context('number', () => {
      it('passes when within range', () => {
        expect(controller.castParam('id', 'number', { minimum: 1, maximum: 1 })).toEqual(1)
      })

      it('throws ParamValidationError when above maximum', () => {
        expect(() => controller.castParam('id', 'number', { maximum: 0 })).toThrow(ParamValidationError)
      })
    })

    context('bigint', () => {
      it('passes when within range', () => {
        expect(controller.castParam('id', 'bigint', { minimum: 0, maximum: 100 })).toEqual('1')
      })

      it('throws ParamValidationError when above maximum', () => {
        expect(() => controller.castParam('id', 'bigint', { maximum: 0 })).toThrow(ParamValidationError)
      })
    })

    context('element-wise on an integer[] cast', () => {
      let arrayController: PsychicController

      beforeEach(() => {
        const ctx = createMockKoaContext({ body: { amounts: [2, 5, 20] } })
        arrayController = new PsychicController(ctx, { action: 'hello' })
      })

      it('passes when every element is within range', () => {
        expect(arrayController.castParam('amounts', 'integer[]', { minimum: 0, maximum: 100 })).toEqual([
          2, 5, 20,
        ])
      })

      it('throws ParamValidationError when any element exceeds maximum', () => {
        expect(() => arrayController.castParam('amounts', 'integer[]', { maximum: 10 })).toThrow(
          ParamValidationError,
        )
      })
    })
  })

  context('numeric coercion hardening', () => {
    function coerceController(body: Record<string, unknown>) {
      const ctx = createMockKoaContext({ body })
      return new PsychicController(ctx, { action: 'hello' })
    }

    context('number', () => {
      it('still accepts ordinary decimals and floats', () => {
        expect(coerceController({ n: '42' }).castParam('n', 'number')).toEqual(42)
        expect(coerceController({ n: '-3.14' }).castParam('n', 'number')).toEqual(-3.14)
        expect(coerceController({ n: '1e3' }).castParam('n', 'number')).toEqual(1000)
      })

      it('rejects Infinity/1e999/hex forms with a ParamValidationError', () => {
        expect(() => coerceController({ n: 'Infinity' }).castParam('n', 'number')).toThrow(
          ParamValidationError,
        )
        expect(() => coerceController({ n: '1e999' }).castParam('n', 'number')).toThrow(ParamValidationError)
        expect(() => coerceController({ n: '0x10' }).castParam('n', 'number')).toThrow(ParamValidationError)
      })
    })

    context('integer', () => {
      it('still accepts ordinary integers', () => {
        expect(coerceController({ n: '42' }).castParam('n', 'integer')).toEqual(42)
        expect(coerceController({ n: '-7' }).castParam('n', 'integer')).toEqual(-7)
      })

      it('rejects a precision-losing 40-digit integer string with a ParamValidationError', () => {
        expect(() =>
          coerceController({ n: '1234567890123456789012345678901234567890' }).castParam('n', 'integer'),
        ).toThrow(ParamValidationError)
      })
    })
  })

  context('with openapi shape provided', () => {
    context('openapi shape is valid', () => {
      it('casts the param to the shape, coercing types where pertinent', () => {
        expect(
          controller.castParam('openapiTest', {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: {
                  intTest: { type: 'integer' },
                  stringTest: { type: 'string' },
                },
              },
            },
          }),
        ).toEqual({
          nested: {
            intTest: 123,
            dateTest: '2025-01-01',
          },
        })
      })

      it('type test - ensure that types are correctly delivered for complex openapi shapes', () => {
        const res = controller.castParam('openapiTest', {
          type: 'object',
          properties: {
            nested: {
              type: 'object',
              properties: {
                intTest: { type: 'integer' },
                stringTest: { type: 'string' },
                oneOfTest: { oneOf: [{ type: 'string' }, { type: 'number' }] },
                oneOfArrayTest: {
                  type: 'array',
                  items: {
                    oneOf: [{ type: 'string' }, { type: 'number' }],
                  },
                },
                anyOfTest: { anyOf: [{ type: 'string' }, { type: 'number' }] },
                anyOfArrayTest: {
                  type: 'array',
                  items: {
                    anyOf: [{ type: 'string' }, { type: 'number' }],
                  },
                },
                allOfTest: {
                  allOf: [
                    { type: 'object', properties: { a: { type: 'string' } } },
                    { type: 'object', properties: { b: { type: 'boolean' } } },
                    { type: 'object', properties: { c: { type: 'integer' } } },
                  ],
                },
                allOfArrayTest: {
                  type: 'array',
                  items: {
                    allOf: [
                      { type: 'object', properties: { a: { type: 'string' } } },
                      { type: 'object', properties: { b: { type: 'boolean' } } },
                      { type: 'object', properties: { c: { type: 'integer' } } },
                    ],
                  },
                },
              },
            },
          },
        })

        // manually check each of these types to ensure
        // they are the expected types

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const int1: number = res?.nested?.intTest // number

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const str1: string = res?.nested?.stringTest // string

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const oneOf1: string | number = res?.nested?.oneOfTest // string | number

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const oneOfArr1: string[] | number[] = res?.nested?.oneOfArrayTest // string[] | number[]

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const anyOfArr1: (string | number)[] = res?.nested?.anyOfArrayTest // (string | number)[]

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allOfA: string = res?.nested?.allOfTest?.a // string

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allOfB: boolean = res?.nested?.allOfTest?.b // boolean

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allOfC: number = res?.nested?.allOfTest?.c // number

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allOfArrA: string | undefined = res?.nested?.allOfArrayTest?.[0]?.a // string | undefined

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allOfArrB: boolean | undefined = res?.nested?.allOfArrayTest?.[0]?.b // boolean | undefined

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allOfArrC: number | undefined = res?.nested?.allOfArrayTest?.[0]?.c // number | undefined
      })
    })

    context('openapi shape is invalid', () => {
      it('raises an exception', () => {
        expect(() =>
          controller.castParam('openapiTest', {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: {
                  intTest: { type: 'boolean' },
                  stringTest: { type: 'string' },
                },
              },
            },
          }),
        ).toThrow(ParamValidationError)
      })
    })
  })
})

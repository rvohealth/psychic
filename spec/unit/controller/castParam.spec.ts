import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller/index.js'
import { Params, ParamValidationError } from '../../../src/index.js'
import PsychicApp from '../../../src/psychic-app/index.js'

const TestEnumValues = ['hello', 'world'] as const
type TestEnum = (typeof TestEnumValues)[number]

describe('PsychicController#castParam', () => {
  let controller: PsychicController

  beforeEach(() => {
    const req = getMockReq({
      body: {
        id: 1,
        name: 'howyadoin',
        createdAt: 'hello',
        updatedAt: 'birld',
        deletedAt: 'sometimeago',
        subBody: { hello: 'world' },
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
    }) as unknown as Request
    const res = getMockRes().res as unknown as Response
    controller = new PsychicController(req, res, { config: new PsychicApp(), action: 'hello' })
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

    it('disallows values that aren’t allowed by the enum', () => {
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

    it('disallows values that aren’t allowed by the enum', () => {
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

  context('when the specified sub-object doesn’t exist', () => {
    it('throws ParamValidationError', () => {
      expect(() => controller.castParam('invalidSubBody.hello', 'string')).toThrow(ParamValidationError)
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

    context('when the specified sub-object doesn’t exist', () => {
      it('returns null', () => {
        expect(controller.castParam('invalidSubBody.hello', 'string', { allowNull: true })).toBeNull()
      })
    })
  })

  context('with openapi shape provided', () => {
    context('openapi shape is valid', () => {
      it('casts the param to the shape, coercing types where pertinent', () => {
        const p = controller.castParam('openapiTest', {
          type: 'object',
          properties: {
            nested: {
              type: 'object',
              properties: {
                ham: {
                  type: 'array',
                  items: {
                    oneOf: [{ type: 'string' }, { type: 'number' }],
                  },
                },
                intTest: { type: 'integer' },
                stringTest: { type: 'string' },
                allOfTest: {
                  allOf: [
                    { type: 'object', properties: { a: { type: 'string' } } },
                    { type: 'object', properties: { b: { type: 'string' } } },
                    { type: 'object', properties: { c: { type: 'string' } } },
                  ],
                },
              },
            },
          },
        })
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
    })
  })
})

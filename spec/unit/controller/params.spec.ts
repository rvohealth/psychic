import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller/index.js'
import { Params } from '../../../src/index.js'
import PsychicApplication from '../../../src/psychic-application/index.js'
import { ParamValidationError } from '../../../src/server/params.js'
import User from '../../../test-app/src/app/models/User.js'

const TestEnumValues = ['hello', 'world'] as const
type TestEnum = (typeof TestEnumValues)[number]

describe('PsychicController', () => {
  describe('get #params', () => {
    it('returns both body and query params', () => {
      const req = getMockReq({
        body: { search: 'abc' },
        query: { cool: 'boyjohnson' },
      }) as unknown as Request
      const res = getMockRes().res as unknown as Response
      const controller = new PsychicController(req, res, {
        config: new PsychicApplication(),
        action: 'hello',
      })

      expect(controller.params.search).toEqual('abc')
      expect(controller.params.cool).toEqual('boyjohnson')
    })
  })

  describe('#castParam', () => {
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
          helloGoodbyeArray: ['hello', 'goodbye'],
        },
      }) as unknown as Request
      const res = getMockRes().res as unknown as Response
      controller = new PsychicController(req, res, { config: new PsychicApplication(), action: 'hello' })
    })

    it('returns the result of Params.cast', () => {
      const spy = vi.spyOn(Params, 'cast').mockReturnValue('chalupas dujour')
      expect(controller.castParam('name', 'string', { allowNull: true })).toEqual('chalupas dujour')
      expect(spy).toHaveBeenCalledWith('howyadoin', 'string', { allowNull: true })
    })

    it('can traverse dot notation', () => {
      const spy = vi.spyOn(Params, 'cast')
      expect(controller.castParam('subBody.hello', 'string')).toEqual('world')
      expect(spy).toHaveBeenCalledWith('world', 'string', undefined)
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
        expect(() => controller.castParam('dotNotationToString.hello', 'string')).toThrow(
          ParamValidationError,
        )
      })
    })

    context('when dot notation specifies a an array', () => {
      it('throws ParamValidationError', () => {
        expect(() => controller.castParam('dotNotationToArray.hello', 'string')).toThrow(ParamValidationError)
      })
    })

    context('with allowNull', () => {
      it('can traverse dot notation', () => {
        const spy = vi.spyOn(Params, 'cast')
        expect(controller.castParam('subBody.hello', 'string', { allowNull: true })).toEqual('world')
        expect(spy).toHaveBeenCalledWith('world', 'string', { allowNull: true })
      })

      context('when the specified sub-object doesn’t exist', () => {
        it('returns null', () => {
          expect(controller.castParam('invalidSubBody.hello', 'string', { allowNull: true })).toBeNull()
        })
      })
    })
  })

  describe('#paramsFor', () => {
    it('returns filtered params', () => {
      const req = getMockReq({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      }) as unknown as Request
      const res = getMockRes().res as unknown as Response
      const controller = new PsychicController(req, res, {
        config: new PsychicApplication(),
        action: 'hello',
      })

      expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
    })

    context('leading and trailing whitespace is filtered from strings', () => {
      it('returns filtered params', () => {
        const req = getMockReq({
          body: {
            id: 1,
            name: 'howyadoin   ',
            createdAt: 'hello',
            updatedAt: 'birld',
            deletedAt: 'sometimeago',
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, {
          config: new PsychicApplication(),
          action: 'hello',
        })

        expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
      })
    })

    context('with a key passed', () => {
      it('drills into the params via the provided key', () => {
        const req = getMockReq({
          body: {
            user: {
              id: 1,
              name: 'howyadoin',
              createdAt: 'hello',
              updatedAt: 'birld',
              deletedAt: 'sometimeago',
            },
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, {
          config: new PsychicApplication(),
          action: 'hello',
        })

        expect(controller.paramsFor(User, { key: 'user' })).toEqual({ name: 'howyadoin' })
      })

      context('the key is not present', () => {
        it('does not raise an exception', () => {
          const req = getMockReq({
            body: {},
          }) as unknown as Request

          const res = getMockRes().res as unknown as Response
          const controller = new PsychicController(req, res, {
            config: new PsychicApplication(),
            action: 'hello',
          })

          expect(controller.paramsFor(User, { key: 'user' })).toEqual({})
        })
      })
    })

    context('with options passed', () => {
      it('passes options through', () => {
        const req = getMockReq({
          body: {
            id: 1,
            name: 'howyadoin',
            email: 'how@yadoin',
            createdAt: 'hello',
            updatedAt: 'birld',
            deletedAt: 'sometimeago',
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, {
          config: new PsychicApplication(),
          action: 'hello',
        })

        expect(controller.paramsFor(User, { only: ['name'] })).toEqual({ name: 'howyadoin' })
      })
    })
  })
})

import { PsychicParamsDictionary } from '../../../src/controller'
import Params, { ParamValidationError } from '../../../src/server/params'

describe('Params', () => {
  describe('#expect', () => {
    context('data types', () => {
      context('primitive values', () => {
        context('string', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated('howyadoin', 'string')).toEqual('howyadoin')
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated(7, 'string')).toThrowError(ParamValidationError)
            })
          })

          context('with match passed', () => {
            context('with a valid value', () => {
              it('returns the requsted value', () => {
                expect(Params.validated('howyadoin', 'string', { match: /howya.*/ })).toEqual('howyadoin')
              })
            })

            context('with an invalid value', () => {
              it('raises a validation exception', () => {
                expect(() => Params.validated('howyadoin', 'string', { match: /howya.*zzz/ })).toThrowError(
                  ParamValidationError
                )
                expect(() => Params.validated(7, 'string', { match: /howya.*zzz/ })).toThrowError(
                  ParamValidationError
                )
              })
            })
          })
        })

        context('regex', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated('howyadoin', /howya.*/)).toEqual('howyadoin')
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated('howyadoin', /howya.*zzz/)).toThrowError(ParamValidationError)
              expect(() => Params.validated(7, /howya.*zzz/)).toThrowError(ParamValidationError)
            })
          })
        })

        context('number', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated(7, 'number')).toEqual(7)
              expect(Params.validated('7', 'number')).toEqual(7)
              expect(Params.validated('7.1', 'number')).toEqual(7.1)
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated('hello', 'number')).toThrowError(ParamValidationError)
              expect(() => Params.validated('777hello', 'number')).toThrowError(ParamValidationError)
            })
          })
        })

        context('integer', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated(7, 'integer')).toEqual(7)
              expect(Params.validated('7', 'number')).toEqual(7)
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated(7.1, 'integer')).toThrowError(ParamValidationError)
              expect(() => Params.validated('0x777', 'integer')).toThrowError(ParamValidationError)
            })
          })
        })

        context('boolean', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated(true, 'boolean')).toEqual(true)
              expect(Params.validated(false, 'boolean')).toEqual(false)
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated('hello', 'boolean')).toThrowError(ParamValidationError)
            })
          })
        })

        context('null', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated(null, 'null')).toEqual(null)
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated('hello', 'null')).toThrowError(ParamValidationError)
            })
          })
        })

        context('string[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated(['hello', 'world'], 'string[]')).toEqual(['hello', 'world'])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated(['hello', 1], 'string[]')).toThrowError(ParamValidationError)
            })
          })

          context('with match passed', () => {
            context('with a valid value', () => {
              it('returns the requsted value', () => {
                expect(
                  Params.validated(['howyadoin', 'howyanotdoin'], 'string[]', { match: /howya.*/ })
                ).toEqual(['howyadoin', 'howyanotdoin'])
              })
            })

            context('with an invalid value', () => {
              it('raises a validation exception', () => {
                expect(() =>
                  Params.validated(['howyadoin', 'howyadoinzzz'], 'string[]', { match: /howya.*zzz/ })
                ).toThrowError(ParamValidationError)
                expect(() =>
                  Params.validated([1, 'howyadoinzzz'], 'string[]', { match: /howya.*zzz/ })
                ).toThrowError(ParamValidationError)
              })
            })
          })
        })

        context('number[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated([1, 2], 'number[]')).toEqual([1, 2])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated(['hello', 1], 'string[]')).toThrowError(ParamValidationError)
            })
          })
        })

        context('integer[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated([1, 2], 'integer[]')).toEqual([1, 2])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated([1.1, 1], 'integer[]')).toThrowError(ParamValidationError)
            })
          })
        })

        context('boolean[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated([true, false], 'boolean[]')).toEqual([true, false])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated(['hello', true], 'boolean[]')).toThrowError(ParamValidationError)
            })
          })
        })

        context('null[]', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated([null, null], 'null[]')).toEqual([null, null])
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated(['hello', null], 'null[]')).toThrowError(ParamValidationError)
            })
          })
        })

        context('enum', () => {
          context('with a valid value', () => {
            it('returns the requsted value', () => {
              expect(Params.validated('hello', { enum: ['hello', 'world'] })).toEqual('hello')
            })
          })

          context('with an invalid value', () => {
            it('raises a validation exception', () => {
              expect(() => Params.validated('birld', { enum: ['hello', 'world'] })).toThrowError(
                ParamValidationError
              )
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
            ])
          )
        ).toEqual([])
      })
    })
  })

  describe('#casing', () => {
    it('works together with restrict to snakeify attribute keys when ingesting params', () => {
      expect(Params.casing('snake').restrict({ HelloWorld: 'HowAreYou' }, ['hello_world'])).toEqual({
        hello_world: 'HowAreYou',
      })
    })

    it('works together with restrict to camelize attribute keys when ingesting params', () => {
      expect(Params.casing('camel').restrict({ hello_world: 'HowAreYou' }, ['helloWorld'])).toEqual({
        helloWorld: 'HowAreYou',
      })
    })
  })
})

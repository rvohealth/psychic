import { DateTime } from 'luxon'
import { PsychicParamsDictionary } from '../../../src/controller'
import Params, { ParamValidationError } from '../../../src/server/params'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Params', () => {
  describe('#for', () => {
    context('enum', () => {
      it('permits values inside the enum', () => {
        expect(Params.for({ species: 'cat' }, Pet)).toEqual({ species: 'cat' })
        expect(Params.for({ species: 'noncat' }, Pet)).toEqual({ species: 'noncat' })
      })

      it('rejects values outside the enum', () => {
        expect(() => Params.for({ species: 'invalid' }, Pet)).toThrowError(ParamValidationError)
      })
    })

    context('bigint', () => {
      it('permits a string integer', () => {
        expect(Params.for({ collarCount: '1' }, Pet)).toEqual({ collarCount: '1' })
      })

      it('permits a number', () => {
        expect(Params.for({ collarCount: 1 }, Pet)).toEqual({ collarCount: '1' })
      })

      it('rejects a string non-integer', () => {
        expect(() => Params.for({ collarCount: '1.2' }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCount: '' }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCount: true }, Pet)).toThrowError(ParamValidationError)
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredCollarCount: null }, Pet)).toThrowError(ParamValidationError)
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
        expect(() => Params.for({ favoriteBigints: ['1.2'] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBigints: [''] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBigints: ['abc'] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBigints: [true] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBigints: [{ data: 'hello' }] }, User)).toThrowError(
          ParamValidationError
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteBigints: null }, User)).toThrowError(ParamValidationError)
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

      it('rejects a number', () => {
        expect(() => Params.for({ likesWalks: 1 }, Pet)).toThrowError(ParamValidationError)
      })

      it('rejects a string float value', () => {
        expect(() => Params.for({ likesWalks: '1.2' }, Pet)).toThrowError(ParamValidationError)
      })

      it('rejects a blank string', () => {
        expect(() => Params.for({ likesWalks: '' }, Pet)).toThrowError(ParamValidationError)
      })

      it('rejects a non-blank string', () => {
        expect(() => Params.for({ likesWalks: 'abc' }, Pet)).toThrowError(ParamValidationError)
      })

      it('rejects null', () => {
        expect(() => Params.for({ likesTreats: null }, Pet)).toThrowError(ParamValidationError)
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
        expect(() => Params.for({ favoriteBooleans: ['1.2'] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBooleans: [''] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBooleans: ['abc'] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBooleans: [1] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteBooleans: [{ data: 'hello' }] }, User)).toThrowError(
          ParamValidationError
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteBooleans: null }, User)).toThrowError(ParamValidationError)
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
        expect(() => Params.for({ collarCountInt: '1.2' }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCountInt: 1.2 }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCountInt: '' }, Pet)).toThrowError(ParamValidationError)
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredCollarCountInt: null }, Pet)).toThrowError(ParamValidationError)
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
        expect(() => Params.for({ favoriteIntegers: ['1.2'] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteIntegers: [1.2] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteIntegers: [''] }, User)).toThrowError(ParamValidationError)
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteIntegers: null }, User)).toThrowError(ParamValidationError)
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
        expect(() => Params.for({ collarCountNumeric: '' }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCountNumeric: 'abc' }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCountNumeric: true }, Pet)).toThrowError(ParamValidationError)
        expect(() => Params.for({ collarCountNumeric: { hello: 'world' } }, Pet)).toThrowError(
          ParamValidationError
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredCollarCountNumeric: null }, Pet)).toThrowError(ParamValidationError)
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
        expect(() => Params.for({ favoriteNumerics: [''] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteNumerics: ['abc'] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteNumerics: [true] }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteNumerics: [{ hello: 'world' }] }, User)).toThrowError(
          ParamValidationError
        )
        expect(() => Params.for({ favoriteNumerics: '' }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteNumerics: 'abc' }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteNumerics: true }, User)).toThrowError(ParamValidationError)
        expect(() => Params.for({ favoriteNumerics: { hello: 'world' } }, User)).toThrowError(
          ParamValidationError
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteNumerics: null }, User)).toThrowError(ParamValidationError)
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
            expect(() => Params.for({ [notNullField]: 1.2 }, notNullModel)).toThrowError(ParamValidationError)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      }
    )

    const stringArrayScenarios = [
      { dbType: 'character varying[]', allowNull: ['nicknames', User], notNull: ['requiredNicknames', User] },
      { dbType: 'text[]', allowNull: ['favoriteTexts', User], notNull: ['requiredFavoriteTexts', User] },
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
            expect(() => Params.for({ [notNullField]: 1 }, notNullModel)).toThrowError(ParamValidationError)
            expect(() => Params.for({ [notNullField]: 1.2 }, notNullModel)).toThrowError(ParamValidationError)
            expect(() => Params.for({ [notNullField]: true }, notNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [notNullField]: [1] }, notNullModel)).toThrowError(ParamValidationError)
            expect(() => Params.for({ [notNullField]: [1.2] }, notNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [notNullField]: [true] }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      }
    )

    const jsonScenarios = [
      { dbType: 'jsonb', allowNull: ['jsonbData', User], notNull: ['requiredJsonbData', User] },
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
            expect(() => Params.for({ [notNullField]: 'abc123' }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          it('rejects a blank string', () => {
            expect(() => Params.for({ [notNullField]: '' }, notNullModel)).toThrowError(ParamValidationError)
          })

          it('rejects a number', () => {
            expect(() => Params.for({ [notNullField]: 1 }, notNullModel)).toThrowError(ParamValidationError)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      }
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
            expect(() => Params.for({ [notNullField]: ['abc123'] }, notNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [notNullField]: [''] }, notNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [notNullField]: [1] }, notNullModel)).toThrowError(ParamValidationError)
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          context('the field allows null', () => {
            it('permits null', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      }
    )

    const datetimeScenarios = [
      { dbType: 'date', allowNull: ['birthdate', User], notNull: ['createdOn', User] },
      {
        dbType: 'timestamp without time zone',
        allowNull: ['lastSeenAt', Pet],
        notNull: ['lastHeardAt', Pet],
      },
    ] as const

    datetimeScenarios.forEach(
      ({ dbType, notNull: [notNullField, notNullModel], allowNull: [allowNullField, allowNullModel] }) => {
        context(dbType, () => {
          const now = DateTime.now()

          it('permits a datetime', () => {
            expect(Params.for({ [allowNullField]: now }, allowNullModel)).toEqual({ [allowNullField]: now })
          })

          it('permits a number, but treats it as number of milliseconds since epoch and casts to datetime', () => {
            const millis = 1714027129950
            expect(Params.for({ [allowNullField]: millis }, allowNullModel)).toEqual({
              [allowNullField]: DateTime.fromMillis(millis),
            })
          })

          it('rejects a string non-datetime', () => {
            expect(() => Params.for({ [allowNullField]: '1.2' }, allowNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [allowNullField]: '' }, allowNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [allowNullField]: 'abc' }, allowNullModel)).toThrowError(
              ParamValidationError
            )
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      }
    )

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

          it('permits a number array, but treats it as number of milliseconds since epoch and casts to datetime', () => {
            const millis = 1714027129950
            expect(Params.for({ [allowNullField]: [millis] }, allowNullModel)).toEqual({
              [allowNullField]: [DateTime.fromMillis(millis)],
            })
          })

          it('rejects a string non-datetime array', () => {
            expect(() => Params.for({ [allowNullField]: ['1.2'] }, allowNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [allowNullField]: [''] }, allowNullModel)).toThrowError(
              ParamValidationError
            )
            expect(() => Params.for({ [allowNullField]: ['abc'] }, allowNullModel)).toThrowError(
              ParamValidationError
            )
          })

          it('rejects null', () => {
            expect(() => Params.for({ [notNullField]: null }, notNullModel)).toThrowError(
              ParamValidationError
            )
          })

          context('the field allows null', () => {
            it('returns null for the specified field', () => {
              expect(Params.for({ [allowNullField]: null }, allowNullModel)).toEqual({
                [allowNullField]: null,
              })
            })
          })
        })
      }
    )

    context('uuid', () => {
      it('permits a uuid', () => {
        expect(Params.for({ uuid: '883b3fc3-70a8-401c-a04a-a14b196ef832' }, User)).toEqual({
          uuid: '883b3fc3-70a8-401c-a04a-a14b196ef832',
        })
      })

      it('rejects non-uuid', () => {
        expect(() => Params.for({ uuid: '883b3fc3-70a8-401c-a04a-a14b196ef83' }, User)).toThrowError(
          ParamValidationError
        )
      })

      it('rejects null', () => {
        expect(() => Params.for({ uuid: null }, User)).toThrowError(ParamValidationError)
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
        expect(() =>
          Params.for({ favoriteUuids: ['883b3fc3-70a8-401c-a04a-a14b196ef83'] }, User)
        ).toThrowError(ParamValidationError)
      })

      it('rejects null', () => {
        expect(() => Params.for({ requiredFavoriteUuids: null }, User)).toThrowError(ParamValidationError)
      })

      context('the field allows null', () => {
        it('returns null for the specified field', () => {
          expect(Params.for({ favoriteUuids: null }, User)).toEqual({ favoriteUuids: null })
        })
      })
    })
  })

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

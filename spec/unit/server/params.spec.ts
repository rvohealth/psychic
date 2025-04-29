import { CalendarDate, DateTime } from '@rvoh/dream'
import { PsychicParamsDictionary } from '../../../src/controller/index.js'
import { ParamValidationError, ParamValidationErrors } from '../../../src/index.js'
import Params from '../../../src/server/params.js'
import Pet from '../../../test-app/src/app/models/Pet.js'
import User from '../../../test-app/src/app/models/User.js'

const TestEnumValues = ['hello', 'world'] as const
type TestEnum = (typeof TestEnumValues)[number]

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
    })

    context('with only option passed', () => {
      it('restricts attributes to only those passed in the only array', () => {
        const params = Params.for({ id: 123, email: 'how', password: 'yadoin' }, User, {
          only: ['email', 'name'],
        })
        expect(params).toEqual({ email: 'how' })
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
          lastSeenAt: now,
        })
      })

      it('rejects a string non-datetime', () => {
        expect(() => Params.for({ lastSeenAt: '1.2' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ lastSeenAt: '' }, Pet)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ lastSeenAt: 'abc' }, Pet)).toThrow(ParamValidationErrors)
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

      it('rejects a string non-datetime', () => {
        expect(() => Params.for({ birthdate: '1.2' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ birthdate: '' }, User)).toThrow(ParamValidationErrors)
        expect(() => Params.for({ birthdate: 'abc' }, User)).toThrow(ParamValidationErrors)
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
              expect(Params.cast({ howyadoin: null }, 'howyadoin', 'null')).toEqual(null)
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
                ).toEqual(null)
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
                ).toEqual(null)
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
                ).toEqual(null)
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
                ).toEqual(null)
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
                ).toEqual(null)
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

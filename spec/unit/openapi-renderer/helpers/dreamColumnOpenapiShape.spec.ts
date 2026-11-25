import { DreamSerializer } from '@rvoh/dream'
import { OpenapiSchemaBody } from '@rvoh/dream/openapi'
import SerializerOpenapiShapeOnJSONColumn from '../../../../src/error/openapi/SerializerOpenapiShapeOnJSONColumn.js'
import {
  dreamColumnOpenapiShape,
  UseCustomOpenapiForJson,
} from '../../../../src/openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import OpenapiSegmentExpander from '../../../../src/openapi-renderer/body-segment.js'
import OpenapiEnumCollector from '../../../../src/openapi-renderer/helpers/OpenapiEnumCollector.js'
import SerializerOpenapiRenderer from '../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Availability from '../../../../test-app/src/app/models/Availability.js'
import ModelWithDeclaredShapes from '../../../../test-app/src/app/models/ModelWithDeclaredShapes.js'
import User from '../../../../test-app/src/app/models/User.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/src/types/db.js'

describe('dreamAttributeOpenapiShape', () => {
  context('bigint primaryKey', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'id')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'integer',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('varchar', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'name')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'email')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('varchar[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'nicknames')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredNicknames')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('text', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'notes')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'bio')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('text[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteTexts')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteTexts')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('citext', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteCitext')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteCitext')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('citext[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteCitexts')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteCitexts')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('uuid', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'optionalUuid')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'uuid')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('uuid[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteUuids')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteUuids')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('date', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'birthdate')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        format: 'date',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'createdOn')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('date[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteDates')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            format: 'date',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteDates')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })
  })

  context('timestamp', () => {
    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'createdAt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date-time',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('timestamp[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteDatetimes')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            format: 'date-time',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteDatetimes')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
              format: 'date-time',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('time', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', Availability, 'end')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', Availability, 'start')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('time[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', Availability, 'times')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })
  })

  context('timetz', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', Availability, 'endtz')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', Availability, 'starttz')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('timetz[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', Availability, 'timetzs')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })
  })

  context('integer', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'collarCountInt')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['integer', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredCollarCountInt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'integer',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('integer[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteIntegers')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'integer',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteIntegers')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'integer',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('decimal(6, 3)', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'volume')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['number', 'null'],
        format: 'decimal',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('numeric', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'collarCountNumeric')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['number', 'null'],
        format: 'decimal',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('numeric[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteNumerics')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'number',
            format: 'decimal',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteNumerics')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'number',
              format: 'decimal',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('bigint', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteBigint')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        format: 'bigint',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteBigint')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'bigint',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('bigint[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteBigints')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            format: 'bigint',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteBigints')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
              format: 'bigint',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('boolean', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'likesWalks')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['boolean', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'likesTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'boolean',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('boolean[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteBooleans')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'boolean',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape('Test', User, 'requiredFavoriteBooleans')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'boolean',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('enum', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape('Test', User, 'species')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        enum: [...SpeciesTypesEnumValues, null],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('enum array', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape('Test', User, 'favoriteTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            enum: [...PetTreatsEnumValues],
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('with an enumCollector', () => {
      context('scalar enum column', () => {
        it('collects the full pg value set when there is no override, without the rendered null', () => {
          const enumCollector = new OpenapiEnumCollector()
          dreamColumnOpenapiShape('Test', User, 'species', undefined, { enumCollector })

          expect(enumCollector.toEnumMap()).toEqual({
            species_types_enum: [...SpeciesTypesEnumValues].sort(),
          })
        })

        it('collects only the subset exposed by a top-level enum: override', () => {
          const enumCollector = new OpenapiEnumCollector()
          dreamColumnOpenapiShape(
            'Test',
            User,
            'species',
            { type: ['string', 'null'], enum: ['cat'] },
            { enumCollector },
          )

          expect(enumCollector.toEnumMap()).toEqual({ species_types_enum: ['cat'] })
        })
      })

      context('array enum column', () => {
        it('collects the full pg value set when there is no override', () => {
          const enumCollector = new OpenapiEnumCollector()
          dreamColumnOpenapiShape('Test', User, 'favoriteTreats', undefined, { enumCollector })

          expect(enumCollector.toEnumMap()).toEqual({
            pet_treats_enum: [...PetTreatsEnumValues].sort(),
          })
        })

        it('collects only the subset exposed by an items-level enum: override', () => {
          const enumCollector = new OpenapiEnumCollector()
          dreamColumnOpenapiShape(
            'Test',
            User,
            'favoriteTreats',
            { type: ['array', 'null'], items: { type: 'string', enum: ['snick snowcks'] } },
            { enumCollector },
          )

          expect(enumCollector.toEnumMap()).toEqual({ pet_treats_enum: ['snick snowcks'] })
        })

        context('items: override without an enum', () => {
          it('collects nothing, mirroring the enum-free rendered spec', () => {
            const enumCollector = new OpenapiEnumCollector()
            const openApiShape = dreamColumnOpenapiShape(
              'Test',
              User,
              'favoriteTreats',
              { type: ['array', 'null'], items: { type: 'string' } },
              { enumCollector },
            )

            // the override's whole `items` object replaces the model-derived
            // `items`, so the rendered spec exposes no enum values at all
            expect(openApiShape).toEqual({
              type: ['array', 'null'],
              items: { type: 'string' },
            })
            expect(enumCollector.toEnumMap()).toEqual({})
          })
        })

        context('top-level enum: override', () => {
          it('collects only the override subset the renderer feeds into items.enum', () => {
            const enumCollector = new OpenapiEnumCollector()
            // a top-level `enum:` on an array column is not expressible in
            // the shorthand types, but the renderer honors it at runtime by
            // feeding it into the rendered `items.enum`
            const openApiShape = dreamColumnOpenapiShape(
              'Test',
              User,
              'favoriteTreats',
              { type: ['array', 'null'], enum: ['snick snowcks'] } as unknown as OpenapiSchemaBody,
              { enumCollector },
            )

            expect((openApiShape as { items?: unknown }).items).toEqual({
              type: 'string',
              enum: ['snick snowcks'],
            })
            expect(enumCollector.toEnumMap()).toEqual({ pet_treats_enum: ['snick snowcks'] })
          })
        })
      })
    })
  })

  context('json', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape('Test', User, 'jsonData')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('json[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape('Test', User, 'favoriteJsons')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('jsonb', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape('Test', User, 'jsonbData')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('jsonb[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape('Test', User, 'favoriteJsonbs')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('an undeclared json column', () => {
    it('still renders a plain object for a request body (allowGenericJson)', () => {
      expect(
        dreamColumnOpenapiShape('Test', User, 'jsonbData', undefined, { allowGenericJson: true }),
      ).toEqual({
        type: ['object', 'null'],
      })
    })

    it('explains @deco.JSON (and no longer the removed jsonAttribute) in UseCustomOpenapiForJson', () => {
      const message = new UseCustomOpenapiForJson(User, 'jsonbData').message
      expect(message).toContain("@deco.JSON({ type: 'object', properties: { hello: 'string' } })")
      expect(message).toContain("public jsonbData: DreamColumn<User, 'jsonbData'>")
      expect(message).toContain(".attribute('jsonbData', {")
      expect(message).not.toContain('jsonAttribute')
    })
  })

  context('a column whose shape the model declares with @deco.JSON', () => {
    // the shapes test-app/src/app/models/User.ts declares
    const requiredJsonbDataShape = {
      type: 'object',
      properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: { type: 'integer' } },
    }
    const requiredFavoriteJsonbsElementShape = {
      type: 'object',
      properties: { label: { type: 'string' }, score: { type: 'number' } },
      required: ['label'],
    }

    // User's declared columns are not nullable; the nullable ones are declared
    // in test-app/src/app/models/ModelWithDeclaredShapes.ts

    it('renders the declared shape', () => {
      expect(dreamColumnOpenapiShape('Test', User, 'requiredJsonbData')).toEqual(requiredJsonbDataShape)
    })

    it('renders the declared shape in a request body too (allowGenericJson)', () => {
      expect(
        dreamColumnOpenapiShape('Test', User, 'requiredJsonbData', undefined, { allowGenericJson: true }),
      ).toEqual(requiredJsonbDataShape)
    })

    it('renders an array column as an array of the declared element shape', () => {
      expect(dreamColumnOpenapiShape('Test', User, 'requiredFavoriteJsonbs')).toEqual({
        type: 'array',
        items: requiredFavoriteJsonbsElementShape,
      })
    })

    it('adds null from a nullable column', () => {
      expect(dreamColumnOpenapiShape('Test', ModelWithDeclaredShapes, 'nullableObject')).toEqual({
        type: ['object', 'null'],
        properties: { hello: { type: 'string' } },
      })
    })

    it('adds null from a nullable column to a shape without a type', () => {
      expect(dreamColumnOpenapiShape('Test', ModelWithDeclaredShapes, 'nullableComposition')).toEqual({
        anyOf: [
          {
            anyOf: [
              { type: 'object', properties: { hello: { type: 'string' } }, required: ['hello'] },
              { type: 'object', properties: { goodbye: { type: 'string' } }, required: ['goodbye'] },
            ],
          },
          { type: 'null' },
        ],
      })
    })

    it('makes a nullable array column a nullable array of non-null elements', () => {
      expect(dreamColumnOpenapiShape('Test', ModelWithDeclaredShapes, 'nullableObjects')).toEqual({
        type: ['array', 'null'],
        items: { type: 'object', properties: { hello: { type: 'string' } } },
      })
    })

    it('layers a description onto the declared shape', () => {
      expect(
        dreamColumnOpenapiShape('Test', User, 'requiredJsonbData', { description: 'Display preferences' }),
      ).toEqual({ ...requiredJsonbDataShape, description: 'Display preferences' })
    })

    it('refuses an openapi that carries a shape', () => {
      expect(() =>
        dreamColumnOpenapiShape('UserSerializer', User, 'requiredJsonbData', {
          type: 'object',
          properties: { hello: 'string' },
        }),
      ).toThrow(SerializerOpenapiShapeOnJSONColumn)

      expect(() =>
        dreamColumnOpenapiShape('UserSerializer', User, 'requiredJsonbData', {
          description: 'Display preferences',
          maxProperties: 3,
        } as OpenapiSchemaBody),
      ).toThrow(SerializerOpenapiShapeOnJSONColumn)
    })

    it('names the serializer, the column and the fix when refusing a shape', () => {
      expect(() => dreamColumnOpenapiShape('UserSerializer', User, 'requiredJsonbData', 'json')).toThrow(
        'UserSerializer passes an OpenAPI shape for User#requiredJsonbData',
      )
    })
  })

  context('a @deco.Virtual attribute', () => {
    // ModelWithDeclaredShapes#objectVirtual declares
    // { a: integer (required), nested: { b: string } }

    it('replaces the declared shape whole with a serializer openapi that carries a shape', () => {
      expect(
        dreamColumnOpenapiShape('Test', ModelWithDeclaredShapes, 'objectVirtual' as 'id', {
          type: ['object', 'null'],
          properties: { b: 'string' },
        }),
      ).toEqual({ type: ['object', 'null'], properties: { b: 'string' } })
    })

    it('layers a description-only serializer openapi onto the declared shape', () => {
      expect(
        dreamColumnOpenapiShape('Test', ModelWithDeclaredShapes, 'objectVirtual' as 'id', {
          description: 'hello',
        }),
      ).toEqual({
        type: 'object',
        properties: {
          a: { type: 'integer' },
          nested: { type: 'object', properties: { b: { type: 'string' } } },
        },
        required: ['a'],
        description: 'hello',
      })
    })
  })

  context('a @deco.Encrypted attribute', () => {
    // ModelWithDeclaredShapes#integerSecret is declared with
    // `@deco.Encrypted({ openapi: 'integer' })`; its backing column,
    // encrypted_integer_secret, allows null

    it('renders a bare @deco.Encrypted() as a string, nullable from its backing column', () => {
      expect(dreamColumnOpenapiShape('Test', User, 'secret' as 'email')).toEqual({ type: ['string', 'null'] })
    })

    it('adds null from a nullable backing column to a declared shape without it', () => {
      expect(dreamColumnOpenapiShape('Test', ModelWithDeclaredShapes, 'integerSecret' as 'id')).toEqual({
        type: ['integer', 'null'],
      })
    })

    it('renders the nullable shape as a serializer attribute', () => {
      const MySerializer = (data: ModelWithDeclaredShapes) =>
        DreamSerializer(ModelWithDeclaredShapes, data).attribute('integerSecret')

      expect(
        new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes[
          'integerSecret'
        ],
      ).toEqual({ type: ['integer', 'null'] })
    })

    it('renders the nullable shape in a model-derived request body', () => {
      expect(
        new OpenapiSegmentExpander({ for: ModelWithDeclaredShapes, params: ['integerSecret'] } as never, {
          renderOpts: {
            casing: 'camel',
            suppressResponseEnums: false,
            legacyImplicitRequestBodyParams: false,
          },
          target: 'request',
        }).render().openapi,
      ).toEqual({ type: 'object', properties: { integerSecret: { type: ['integer', 'null'] } } })
    })
  })
})

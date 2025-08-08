import { OpenapiSchemaBody } from '@rvoh/dream'
import {
  dreamColumnOpenapiShape,
  UseCustomOpenapiForJson,
} from '../../../../src/openapi-renderer/helpers/dreamAttributeOpenapiShape.js'
import User from '../../../../test-app/src/app/models/User.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/src/types/db.js'

describe('dreamAttributeOpenapiShape', () => {
  context('bigint primaryKey', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(User, 'id')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'integer',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('varchar', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(User, 'name')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'email')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('varchar[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'nicknames')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredNicknames')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'notes')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'bio')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('text[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteTexts')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteTexts')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'favoriteCitext')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteCitext')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('citext[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteCitexts')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteCitexts')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'optionalUuid')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'uuid')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('uuid[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteUuids')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteUuids')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'birthdate')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        format: 'date',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'createdOn')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('date[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteDates')
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
        const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteDates')
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
        const openApiShape = dreamColumnOpenapiShape(User, 'createdAt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date-time',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('timestamp[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteDatetimes')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteDatetimes')
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

  context('integer', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(User, 'collarCountInt')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['integer', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'requiredCollarCountInt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'integer',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('integer[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteIntegers')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteIntegers')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'volume')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['number', 'null'],
        format: 'decimal',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('numeric', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(User, 'collarCountNumeric')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['number', 'null'],
        format: 'decimal',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('numeric[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteNumerics')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteNumerics')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'favoriteBigint')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        format: 'bigint',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteBigint')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'bigint',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('bigint[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteBigints')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteBigints')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'likesWalks')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['boolean', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'likesTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'boolean',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('boolean[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteBooleans')
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
          const openApiShape = dreamColumnOpenapiShape(User, 'requiredFavoriteBooleans')
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
      const openApiShape = dreamColumnOpenapiShape(User, 'species')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        enum: [...SpeciesTypesEnumValues, null],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('enum array', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(User, 'favoriteTreats')
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
  })

  context('json', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(User, 'jsonData')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('json[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(User, 'favoriteJsons')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('jsonb', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(User, 'jsonbData')).toThrow(UseCustomOpenapiForJson)
    })
  })

  context('jsonb[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(User, 'favoriteJsonbs')).toThrow(UseCustomOpenapiForJson)
    })
  })
})

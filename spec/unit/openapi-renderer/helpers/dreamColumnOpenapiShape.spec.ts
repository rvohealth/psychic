import { OpenapiSchemaBody } from '@rvoh/dream/openapi'
import {
  dreamColumnOpenapiShape,
  UseCustomOpenapiForJson,
} from '../../../../src/openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import User from '../../../../test-app/src/app/models/User.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/src/types/db.js'
import Availability from '../../../../test-app/src/app/models/Availability.js'

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
})

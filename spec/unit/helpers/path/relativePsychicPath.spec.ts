import relativePsychicPath, {
  psychicPathTypeRelativePath,
} from '../../../../src/helpers/path/relativePsychicPath.js'

describe('relativePsychicPath', () => {
  context('to models', () => {
    context('from serializers with a model name', () => {
      it('returns ../models/<ModelName>.js', () => {
        expect(relativePsychicPath('serializers', 'models', 'User')).toEqual('../models/User.js')
      })
    })

    context('from controller specs with a model name', () => {
      it('returns ../../../src/app/controllers/<ModelName>.js', () => {
        expect(relativePsychicPath('controllerSpecs', 'models', 'User')).toEqual(
          '../../../src/app/models/User.js',
        )
      })
    })

    context('from factories with a model name', () => {
      it('returns ../../src/app/models/<ModelName>.js', () => {
        expect(relativePsychicPath('factories', 'models', 'User')).toEqual('../../src/app/models/User.js')
      })
    })

    context('from serializers with a nested model name', () => {
      it('returns ../models/<NestedName>/<ModelName>.js', () => {
        expect(relativePsychicPath('serializers', 'models', 'Graph/Edge')).toEqual(
          '../../models/Graph/Edge.js',
        )
      })
    })

    context('from factories with a nested model name', () => {
      it('returns ../../src/app/models/<NestedName>/<ModelName>.js', () => {
        expect(relativePsychicPath('factories', 'models', 'Graph/Edge')).toEqual(
          '../../../src/app/models/Graph/Edge.js',
        )
      })
    })

    context('to models with a different origin and destination model', () => {
      context('from serializers with a model name', () => {
        it('returns ../models/<DestinationModelName>.js', () => {
          expect(relativePsychicPath('serializers', 'models', 'User', 'Graph/Edge')).toEqual(
            '../models/Graph/Edge.js',
          )
        })
      })

      context('from factories with a model name', () => {
        it('returns ../../src/app/models/<ModelName>.js', () => {
          expect(relativePsychicPath('factories', 'models', 'User', 'Graph/Edge')).toEqual(
            '../../src/app/models/Graph/Edge.js',
          )
        })
      })

      context('from serializers with a nested model name', () => {
        it('returns ../models/<NestedName>/<ModelName>.js', () => {
          expect(relativePsychicPath('serializers', 'models', 'Graph/Edge', 'User')).toEqual(
            '../../models/User.js',
          )
        })
      })

      context('from factories with a nested model name', () => {
        it('returns ../../src/app/models/<NestedName>/<ModelName>.js', () => {
          expect(relativePsychicPath('factories', 'models', 'Graph/Edge', 'User')).toEqual(
            '../../../src/app/models/User.js',
          )
        })
      })

      context('from models with a model name', () => {
        it('returns ./<NestedName>/<ModelName>.js', () => {
          expect(relativePsychicPath('models', 'models', 'User', 'Graph/Edge')).toEqual('./Graph/Edge.js')
        })
      })

      context('from models with a nested model name', () => {
        it('returns ../<ModelName>.js', () => {
          expect(relativePsychicPath('models', 'models', 'Graph/Edge', 'User')).toEqual('../User.js')
        })
      })
    })

    context('from model with a nested model name to a model in the same directory', () => {
      it('returns ./<ModelName>.js', () => {
        expect(relativePsychicPath('models', 'models', 'Graph/Edge', 'Graph/Base')).toEqual('./Base.js')
        expect(relativePsychicPath('models', 'models', 'Graph/Edge/Hello', 'Graph/Base')).toEqual(
          '../Base.js',
        )
        expect(relativePsychicPath('models', 'models', 'Graph/Edge', 'Graph/Hello/World')).toEqual(
          './Hello/World.js',
        )
      })
    })
  })

  context('to serializers', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer.js', () => {
        expect(relativePsychicPath('models', 'serializers', 'User')).toEqual(
          '../serializers/UserSerializer.js',
        )
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer.js', () => {
        expect(relativePsychicPath('models', 'serializers', 'Graph/Edge')).toEqual(
          '../../serializers/Graph/EdgeSerializer.js',
        )
      })
    })

    context('from serializer with a nested model name to a serializer in the same directory', () => {
      it('returns ./<ModelName>Serializer.js', () => {
        expect(relativePsychicPath('serializers', 'serializers', 'Graph/Edge', 'Graph/Base')).toEqual(
          './BaseSerializer.js',
        )
        expect(relativePsychicPath('serializers', 'serializers', 'Graph/Edge/Hello', 'Graph/Base')).toEqual(
          '../BaseSerializer.js',
        )
        expect(relativePsychicPath('serializers', 'serializers', 'Graph/Edge', 'Graph/Hello/World')).toEqual(
          './Hello/WorldSerializer.js',
        )
      })
    })
  })

  context('to db', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer.js', () => {
        expect(relativePsychicPath('models', 'db', 'User')).toEqual('../../db/')
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer.js', () => {
        expect(relativePsychicPath('models', 'db', 'Graph/Edge')).toEqual('../../../db/')
      })
    })
  })

  context('to factories', () => {
    context('from models with a model name', () => {
      it('returns ../../spec/factories/<ModelName>Factory.js', () => {
        expect(relativePsychicPath('models', 'factories', 'User')).toEqual(
          '../../../spec/factories/UserFactory.js',
        )
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../factories/<NestedName>/<ModelName>Factory.js', () => {
        expect(relativePsychicPath('models', 'factories', 'Graph/Edge')).toEqual(
          '../../../../spec/factories/Graph/EdgeFactory.js',
        )
      })
    })
  })
})

describe('psychicPathTypeRelativePath', () => {
  context('from models to models', () => {
    it('returns an empty string', () => {
      expect(psychicPathTypeRelativePath('models', 'models')).toEqual('')
    })
  })

  context('from serializers to models', () => {
    it('returns ../models', () => {
      expect(psychicPathTypeRelativePath('serializers', 'models')).toEqual('../models')
    })
  })

  context('from factories to models', () => {
    it('returns ../../src/app/models', () => {
      expect(psychicPathTypeRelativePath('factories', 'models')).toEqual('../../src/app/models')
    })
  })
})

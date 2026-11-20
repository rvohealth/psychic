import { Dream, DreamSerializer } from '@rvoh/dream'
import PolymorphicDelegatedAttributeShapesDiffer from '../../../../../src/error/openapi/PolymorphicDelegatedAttributeShapesDiffer.js'
import SerializerOpenapiShapeOnJSONColumn from '../../../../../src/error/openapi/SerializerOpenapiShapeOnJSONColumn.js'
import { validateObject } from '../../../../../src/helpers/validateOpenApiSchema.js'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'

// The test-app has no polymorphic association, so these fixtures build one.
//
// `userTarget` stands in for one target model of a polymorphic BelongsTo: a
// subclass of User that inherits User's declarations and columns unless the
// test replaces them. Only what the renderer reads is replaced: the statics
// `@deco.JSON` (`jsonColumnShapes`) and `@deco.Virtual`/`@deco.Encrypted`
// (`virtualAttributes`) fill at boot, and a column's metadata in the schema.
//
// `petBelongingTo` returns a Pet whose `user` BelongsTo is polymorphic over
// the given targets, in the given order. Pet's `user` association is not
// optional, so the delegated attribute's nullability is the targets' own.

interface ColumnMetadata {
  dbType: string
  allowNull: boolean
  isArray: boolean
  enumValues: null
}

function userTarget(
  name: string,
  {
    jsonColumnShapes,
    virtualAttributes,
    encryptedAttributes,
    columns,
  }: {
    jsonColumnShapes?: { column: string; openapi: unknown }[]
    virtualAttributes?: { property: string; type: unknown }[]
    encryptedAttributes?: { property: string; encryptedColumnName: string }[]
    columns?: Record<string, ColumnMetadata>
  } = {},
): typeof User {
  const Target = class extends User {}
  Object.defineProperty(Target, 'name', { value: name })
  if (jsonColumnShapes) Object.defineProperty(Target, 'jsonColumnShapes', { value: jsonColumnShapes })
  if (virtualAttributes) Object.defineProperty(Target, 'virtualAttributes', { value: virtualAttributes })
  if (encryptedAttributes)
    Object.defineProperty(Target, 'encryptedAttributes', { value: encryptedAttributes })

  if (columns) {
    const schema = User.prototype.schema
    const patchedSchema = {
      ...schema,
      users: { ...schema.users, columns: { ...schema.users.columns, ...columns } },
    }
    Object.defineProperty(Target.prototype, 'schema', { get: () => patchedSchema })
  }

  return Target
}

function petBelongingTo(...targets: (typeof Dream)[]): typeof Pet {
  const Source = class extends Pet {}
  const getAssociationMetadata = (associationName: string) =>
    (Pet as unknown as { getAssociationMetadata(name: string): object }).getAssociationMetadata(
      associationName,
    )

  Object.defineProperty(Source, 'getAssociationMetadata', {
    value: (associationName: string) =>
      associationName === 'user'
        ? { ...getAssociationMetadata('user'), polymorphic: true, modelCB: () => targets }
        : getAssociationMetadata(associationName),
  })
  return Source
}

// renders a serializer delegating `attribute` (with `options`) through Pet's `user`
function renderDelegated(
  source: typeof Pet,
  attribute: 'requiredJsonbData' | 'requiredFavoriteJsonbs' | 'openapiVirtualSpecTest' | 'secret' | 'name',
  options?: object,
) {
  const MySerializer = (data: Pet) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    DreamSerializer(source, data).delegatedAttribute('user', attribute, options as any)

  return new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes[attribute]
}

// validates a value against a rendered property schema with the Ajv options Psychic validates with
function validates(schema: unknown, value: unknown) {
  return validateObject(value, schema as object).isValid
}

// the shapes test-app/src/app/models/User.ts declares with @deco.JSON
const requiredJsonbDataShape = {
  type: 'object',
  properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: { type: 'integer' } },
}
const requiredFavoriteJsonbsElementShape = {
  type: 'object',
  properties: { label: { type: 'string' }, score: { type: 'number' } },
  required: ['label'],
}

const jsonbColumn = (overrides: Partial<ColumnMetadata>): ColumnMetadata => ({
  dbType: 'jsonb',
  allowNull: false,
  isArray: false,
  enumValues: null,
  ...overrides,
})

describe('DreamSerializer delegatedAttribute through a polymorphic association', () => {
  context('when every target declares the identical @deco.JSON shape', () => {
    it('renders that shape, as delegating to one of the targets does', () => {
      const Composer = userTarget('Composer')

      expect(renderDelegated(petBelongingTo(User, Composer), 'requiredJsonbData')).toEqual(
        requiredJsonbDataShape,
      )
      expect(renderDelegated(petBelongingTo(User, Composer), 'requiredJsonbData')).toEqual(
        renderDelegated(Pet, 'requiredJsonbData'),
      )
    })

    it('renders an array column as an array of the declared element shape', () => {
      const Composer = userTarget('Composer')

      expect(renderDelegated(petBelongingTo(User, Composer), 'requiredFavoriteJsonbs')).toEqual({
        type: 'array',
        items: requiredFavoriteJsonbsElementShape,
      })
    })

    it('renders the same shape whatever the order of the targets', () => {
      const Composer = userTarget('Composer')

      expect(renderDelegated(petBelongingTo(Composer, User), 'requiredJsonbData')).toEqual(
        renderDelegated(petBelongingTo(User, Composer), 'requiredJsonbData'),
      )
    })

    it('layers a description-only openapi onto the agreed shape', () => {
      const Composer = userTarget('Composer')

      expect(
        renderDelegated(petBelongingTo(User, Composer), 'requiredJsonbData', {
          openapi: { description: 'display settings' },
        }),
      ).toEqual({ ...requiredJsonbDataShape, description: 'display settings' })
    })

    it('still refuses a shape-carrying openapi, as it does for a single @deco.JSON target', () => {
      const Composer = userTarget('Composer')

      expect(() =>
        renderDelegated(petBelongingTo(User, Composer), 'requiredJsonbData', {
          openapi: { type: 'object', properties: { theme: 'string' } },
        }),
      ).toThrow(SerializerOpenapiShapeOnJSONColumn)
    })

    context('when one target column is nullable and another is not', () => {
      it('renders the shape nullable, whatever the order of the targets', () => {
        const NullableComposer = userTarget('NullableComposer', {
          columns: { requiredJsonbData: jsonbColumn({ allowNull: true }) },
        })

        const nonNullFirst = renderDelegated(petBelongingTo(User, NullableComposer), 'requiredJsonbData')
        const nullableFirst = renderDelegated(petBelongingTo(NullableComposer, User), 'requiredJsonbData')

        expect(nonNullFirst).toEqual({ ...requiredJsonbDataShape, type: ['object', 'null'] })
        expect(nullableFirst).toEqual(nonNullFirst)
        expect(validates(nonNullFirst, null)).toBe(true)
        expect(validates(nonNullFirst, { theme: 'dark' })).toBe(true)
        expect(validates(nonNullFirst, { theme: 'sepia' })).toBe(false)
      })
    })
  })

  context('when the targets declare equal shapes in separate declaration objects', () => {
    // each call builds a new object, so no two targets share a declaration
    const labelShape = () => ({ type: 'object', properties: { label: 'string' } })
    const expandedLabelShape = { type: 'object', properties: { label: { type: 'string' } } }

    const jsonTargets = () =>
      ['JsonComposer', 'JsonArranger'].map(name =>
        userTarget(name, { jsonColumnShapes: [{ column: 'requiredJsonbData', openapi: labelShape() }] }),
      ) as [typeof User, typeof User]

    const virtualTargets = () =>
      ['VirtualComposer', 'VirtualArranger'].map(name =>
        userTarget(name, {
          virtualAttributes: [{ property: 'openapiVirtualSpecTest', type: labelShape() }],
        }),
      ) as [typeof User, typeof User]

    // renders `attribute` of `target` directly, without delegating to it
    function renderOnTarget(target: typeof User, attribute: 'requiredJsonbData' | 'openapiVirtualSpecTest') {
      const MySerializer = (data: User) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DreamSerializer(target, data).attribute(attribute as any)
      return new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes[attribute]
    }

    it('renders the @deco.JSON shape on every render, also after rendering a target directly', () => {
      const [first, second] = jsonTargets()
      const source = petBelongingTo(first, second)

      expect(renderDelegated(source, 'requiredJsonbData')).toEqual(expandedLabelShape)
      expect(renderDelegated(source, 'requiredJsonbData')).toEqual(expandedLabelShape)
      expect(renderOnTarget(second, 'requiredJsonbData')).toEqual(expandedLabelShape)
      expect(renderDelegated(source, 'requiredJsonbData')).toEqual(expandedLabelShape)
      expect(renderDelegated(petBelongingTo(second, first), 'requiredJsonbData')).toEqual(expandedLabelShape)
    })

    it('renders the @deco.Virtual shape on every render, also after rendering a target directly', () => {
      const [first, second] = virtualTargets()
      const source = petBelongingTo(first, second)

      expect(renderDelegated(source, 'openapiVirtualSpecTest')).toEqual(expandedLabelShape)
      expect(renderDelegated(source, 'openapiVirtualSpecTest')).toEqual(expandedLabelShape)
      expect(renderOnTarget(second, 'openapiVirtualSpecTest')).toEqual(expandedLabelShape)
      expect(renderDelegated(source, 'openapiVirtualSpecTest')).toEqual(expandedLabelShape)
      expect(renderDelegated(petBelongingTo(second, first), 'openapiVirtualSpecTest')).toEqual(
        expandedLabelShape,
      )
    })

    it('leaves each target model declaration unchanged', () => {
      const [jsonFirst, jsonSecond] = jsonTargets()
      const [virtualFirst, virtualSecond] = virtualTargets()

      renderDelegated(petBelongingTo(jsonFirst, jsonSecond), 'requiredJsonbData')
      renderOnTarget(jsonSecond, 'requiredJsonbData')
      renderDelegated(petBelongingTo(virtualFirst, virtualSecond), 'openapiVirtualSpecTest')
      renderOnTarget(virtualSecond, 'openapiVirtualSpecTest')

      for (const target of [jsonFirst, jsonSecond])
        expect(target['jsonColumnShapes']).toEqual([{ column: 'requiredJsonbData', openapi: labelShape() }])
      for (const target of [virtualFirst, virtualSecond])
        expect(target['virtualAttributes']).toEqual([
          { property: 'openapiVirtualSpecTest', type: labelShape() },
        ])
    })
  })

  context('when the targets declare different @deco.JSON shapes', () => {
    it('throws, naming the serializer attribute, the association and each target model', () => {
      const Composer = userTarget('Composer', {
        jsonColumnShapes: [
          { column: 'requiredJsonbData', openapi: { type: 'object', properties: { theme: 'string' } } },
        ],
      })

      for (const source of [petBelongingTo(User, Composer), petBelongingTo(Composer, User)]) {
        expect(() => renderDelegated(source, 'requiredJsonbData')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }

      expect(() => renderDelegated(petBelongingTo(User, Composer), 'requiredJsonbData')).toThrow(
        /delegates "requiredJsonbData" through the polymorphic\nassociation "user"[\s\S]*\n {2}User: [\s\S]*\n {2}Composer: /,
      )
    })
  })

  context('when the targets differ in array-ness', () => {
    it('throws, though the declarations are identical', () => {
      const ArrayComposer = userTarget('ArrayComposer', {
        columns: { requiredJsonbData: jsonbColumn({ dbType: 'jsonb[]', isArray: true }) },
      })

      for (const source of [petBelongingTo(User, ArrayComposer), petBelongingTo(ArrayComposer, User)]) {
        expect(() => renderDelegated(source, 'requiredJsonbData')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })
  })

  context('when a target lacks the declaration', () => {
    it('throws when a target model has no such attribute', () => {
      for (const source of [petBelongingTo(User, Pet), petBelongingTo(Pet, User)]) {
        expect(() => renderDelegated(source, 'requiredJsonbData')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('throws when a target leaves the json column undeclared', () => {
      const UndeclaredComposer = userTarget('UndeclaredComposer', { jsonColumnShapes: [] })

      for (const source of [
        petBelongingTo(User, UndeclaredComposer),
        petBelongingTo(UndeclaredComposer, User),
      ]) {
        expect(() => renderDelegated(source, 'requiredJsonbData')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('throws when a target lacks a @deco.Virtual attribute the others declare', () => {
      for (const source of [petBelongingTo(User, Pet), petBelongingTo(Pet, User)]) {
        expect(() => renderDelegated(source, 'openapiVirtualSpecTest')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })
  })

  context('@deco.Virtual / @deco.Encrypted targets', () => {
    const IntegerComposer = () =>
      userTarget('IntegerComposer', {
        virtualAttributes: [{ property: 'openapiVirtualSpecTest', type: 'integer' }],
      })

    it('renders an identical declaration once, whatever the order of the targets', () => {
      const Composer = userTarget('Composer')

      expect(renderDelegated(petBelongingTo(User, Composer), 'openapiVirtualSpecTest')).toEqual({
        type: ['string', 'null'],
      })
      expect(renderDelegated(petBelongingTo(Composer, User), 'openapiVirtualSpecTest')).toEqual({
        type: ['string', 'null'],
      })
    })

    it('throws when the declarations differ', () => {
      for (const source of [
        petBelongingTo(User, IntegerComposer()),
        petBelongingTo(IntegerComposer(), User),
      ]) {
        expect(() => renderDelegated(source, 'openapiVirtualSpecTest')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('renders an explicit shape-carrying openapi override instead of throwing', () => {
      for (const source of [
        petBelongingTo(User, IntegerComposer()),
        petBelongingTo(IntegerComposer(), User),
      ]) {
        expect(renderDelegated(source, 'openapiVirtualSpecTest', { openapi: 'string' })).toEqual({
          type: 'string',
        })
      }
    })

    it('renders the override when a target lacks the attribute', () => {
      expect(
        renderDelegated(petBelongingTo(Pet, User), 'openapiVirtualSpecTest', { openapi: 'string' }),
      ).toEqual({ type: 'string' })
    })

    it('still throws for a description-only openapi, which is not an override', () => {
      expect(() =>
        renderDelegated(petBelongingTo(User, IntegerComposer()), 'openapiVirtualSpecTest', {
          openapi: { description: 'a spec virtual' },
        }),
      ).toThrow(PolymorphicDelegatedAttributeShapesDiffer)
    })
  })

  context('@deco.Encrypted targets', () => {
    // User#secret is a bare @deco.Encrypted() over encrypted_secret, which
    // allows null; these targets declare it over a non-null backing column
    const nonNullBackingColumn = { encryptedSecret: { ...jsonbColumn({}), dbType: 'text' } }

    function secretTarget(name: string, type: unknown, columns?: Record<string, ColumnMetadata>) {
      return userTarget(name, {
        virtualAttributes: [
          ...(User['virtualAttributes'] as { property: string; type: unknown }[]).filter(
            statement => statement.property !== 'secret',
          ),
          { property: 'secret', type },
        ],
        ...(columns ? { columns } : {}),
      })
    }

    context('when the targets differ only in the nullability of their backing columns', () => {
      it('renders a bare @deco.Encrypted() nullable, whatever the order of the targets', () => {
        // a bare @deco.Encrypted() registers 'string' over a non-null column
        const NonNullSecretKeeper = secretTarget('NonNullSecretKeeper', 'string', nonNullBackingColumn)

        expect(renderDelegated(petBelongingTo(User, NonNullSecretKeeper), 'secret')).toEqual({
          type: ['string', 'null'],
        })
        expect(renderDelegated(petBelongingTo(NonNullSecretKeeper, User), 'secret')).toEqual({
          type: ['string', 'null'],
        })
      })

      it('renders a declared shape nullable, whatever the order of the targets', () => {
        const NullableSecretKeeper = secretTarget('NullableSecretKeeper', 'integer')
        const NonNullSecretKeeper = secretTarget('NonNullSecretKeeper', 'integer', nonNullBackingColumn)

        for (const source of [
          petBelongingTo(NullableSecretKeeper, NonNullSecretKeeper),
          petBelongingTo(NonNullSecretKeeper, NullableSecretKeeper),
        ]) {
          const rendered = renderDelegated(source, 'secret')
          expect(rendered).toEqual({ type: ['integer', 'null'] })
          expect(validates(rendered, null)).toBe(true)
          expect(validates(rendered, 5)).toBe(true)
        }
      })
    })

    context('when another target declares the attribute with @deco.Virtual', () => {
      // `secret` as a plain @deco.Virtual: no encrypted attribute, so no
      // backing column adds null to its shape
      function virtualSecretTarget(name: string, type: unknown) {
        return userTarget(name, {
          virtualAttributes: [
            ...(User['virtualAttributes'] as { property: string; type: unknown }[]).filter(
              statement => statement.property !== 'secret',
            ),
            { property: 'secret', type },
          ],
          encryptedAttributes: [],
        })
      }

      it('renders the shape when the effective shapes are identical, whatever the order of the targets', () => {
        // User#secret, a bare @deco.Encrypted() over a nullable column,
        // renders ['string', 'null'], as this @deco.Virtual does
        const VirtualSecretKeeper = virtualSecretTarget('VirtualSecretKeeper', ['string', 'null'])

        for (const source of [
          petBelongingTo(User, VirtualSecretKeeper),
          petBelongingTo(VirtualSecretKeeper, User),
        ]) {
          expect(renderDelegated(source, 'secret')).toEqual({ type: ['string', 'null'] })
        }
      })

      it('throws when the backing column adds null the @deco.Virtual shape lacks', () => {
        const NullableSecretKeeper = secretTarget('NullableSecretKeeper', 'integer')
        const VirtualSecretKeeper = virtualSecretTarget('VirtualSecretKeeper', 'integer')

        for (const source of [
          petBelongingTo(NullableSecretKeeper, VirtualSecretKeeper),
          petBelongingTo(VirtualSecretKeeper, NullableSecretKeeper),
        ]) {
          expect(() => renderDelegated(source, 'secret')).toThrow(PolymorphicDelegatedAttributeShapesDiffer)
        }
      })
    })

    it('throws when the declared shapes differ', () => {
      const IntegerSecretKeeper = secretTarget('IntegerSecretKeeper', 'integer')

      for (const source of [
        petBelongingTo(User, IntegerSecretKeeper),
        petBelongingTo(IntegerSecretKeeper, User),
      ]) {
        expect(() => renderDelegated(source, 'secret')).toThrow(PolymorphicDelegatedAttributeShapesDiffer)
      }
    })
  })

  context('a plain column', () => {
    // the plain-column polymorphic case is outside this rule and unchanged:
    // it renders the first target's column, whatever the other targets hold
    it('renders the first target column without comparing the targets', () => {
      expect(renderDelegated(petBelongingTo(User, Pet), 'name')).toEqual(renderDelegated(Pet, 'name'))
    })
  })
})

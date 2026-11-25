import { DreamApp, DreamSerializer } from '@rvoh/dream'
import PolymorphicDelegatedAttributeShapesDiffer from '../../../../../src/error/openapi/PolymorphicDelegatedAttributeShapesDiffer.js'
import SerializerOpenapiShapeOnJSONColumn from '../../../../../src/error/openapi/SerializerOpenapiShapeOnJSONColumn.js'
import { validateObject } from '../../../../../src/helpers/validateOpenApiSchema.js'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import PolymorphicShapeSource from '../../../../../test-app/src/app/models/PolymorphicShapeSource.js'
import PolymorphicShapeTargetA from '../../../../../test-app/src/app/models/PolymorphicShapeTargetA.js'
import PolymorphicShapeTargetB from '../../../../../test-app/src/app/models/PolymorphicShapeTargetB.js'

// PolymorphicShapeSource belongs to PolymorphicShapeTargetA or
// PolymorphicShapeTargetB through a polymorphic association, which it declares
// once in each order of the targets: `target` (A, then B) and
// `targetInReverseOrder` (B, then A). Each attribute delegated here is declared
// on both targets under one name, which says how the two declarations (or
// their columns) compare. See test-app/src/app/models/PolymorphicShapeTargetA.ts.

type Association = 'target' | 'targetInReverseOrder'
const eitherOrder = ['target', 'targetInReverseOrder'] as const

// renders a serializer delegating `attribute` (with `options`) through `association`
function renderDelegated(association: Association, attribute: string, options?: object) {
  // the attribute names and options are those of either target, which the
  // types of a polymorphic association do not offer
  const MySerializer = (data: PolymorphicShapeSource) =>
    DreamSerializer(PolymorphicShapeSource, data).delegatedAttribute(
      association,
      attribute as never,
      options as never,
    )

  return new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes[attribute]
}

// renders `attribute` of `target` directly, without delegating to it
function renderOnTarget(
  target: typeof PolymorphicShapeTargetA | typeof PolymorphicShapeTargetB,
  attribute: string,
) {
  const MySerializer = (data: PolymorphicShapeTargetA | PolymorphicShapeTargetB) =>
    DreamSerializer(target, data).attribute(attribute as never)

  return new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes[attribute]
}

// validates a value against a rendered property schema with the Ajv options Psychic validates with
function validates(schema: unknown, value: unknown) {
  return validateObject(value, schema as object).isValid
}

// the shape both targets declare for identicalShape and nullableOnB
const themeShape = {
  type: 'object',
  properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: { type: 'integer' } },
}
// the shape both targets declare for each element of identicalElementShape
const labelAndScoreShape = {
  type: 'object',
  properties: { label: { type: 'string' }, score: { type: 'number' } },
  required: ['label'],
}
// the shape both targets declare for identicalObjectVirtual
const labelShape = { type: 'object', properties: { label: { type: 'string' } } }

describe('DreamSerializer delegatedAttribute through a polymorphic association', () => {
  context('when every target declares the identical @deco.JSON shape', () => {
    it('renders that shape, as rendering the attribute on one of the targets does', () => {
      expect(renderDelegated('target', 'identicalShape')).toEqual(themeShape)
      expect(renderDelegated('target', 'identicalShape')).toEqual(
        renderOnTarget(PolymorphicShapeTargetA, 'identicalShape'),
      )
    })

    it('renders an array column as an array of the declared element shape', () => {
      expect(renderDelegated('target', 'identicalElementShape')).toEqual({
        type: 'array',
        items: labelAndScoreShape,
      })
    })

    it('renders the same shape whatever the order of the targets', () => {
      expect(renderDelegated('targetInReverseOrder', 'identicalShape')).toEqual(
        renderDelegated('target', 'identicalShape'),
      )
    })

    it('layers a description-only openapi onto the agreed shape', () => {
      expect(
        renderDelegated('target', 'identicalShape', { openapi: { description: 'display settings' } }),
      ).toEqual({ ...themeShape, description: 'display settings' })
    })

    it('still refuses a shape-carrying openapi, as it does for a single @deco.JSON target', () => {
      expect(() =>
        renderDelegated('target', 'identicalShape', {
          openapi: { type: 'object', properties: { theme: 'string' } },
        }),
      ).toThrow(SerializerOpenapiShapeOnJSONColumn)
    })

    context('when one target column is nullable and another is not', () => {
      it('renders the shape nullable, whatever the order of the targets', () => {
        const nonNullFirst = renderDelegated('target', 'nullableOnB')
        const nullableFirst = renderDelegated('targetInReverseOrder', 'nullableOnB')

        expect(nonNullFirst).toEqual({ ...themeShape, type: ['object', 'null'] })
        expect(nullableFirst).toEqual(nonNullFirst)
        expect(validates(nonNullFirst, null)).toBe(true)
        expect(validates(nonNullFirst, { theme: 'dark' })).toBe(true)
        expect(validates(nonNullFirst, { theme: 'sepia' })).toBe(false)
      })
    })
  })

  context('when the targets declare equal shapes in separate declaration objects', () => {
    // each target's decorator is given its own object, so no two targets
    // share a declaration

    it('renders the @deco.JSON shape on every render, also after rendering a target directly', () => {
      expect(renderDelegated('target', 'identicalShape')).toEqual(themeShape)
      expect(renderDelegated('target', 'identicalShape')).toEqual(themeShape)
      expect(renderOnTarget(PolymorphicShapeTargetB, 'identicalShape')).toEqual(themeShape)
      expect(renderDelegated('target', 'identicalShape')).toEqual(themeShape)
      expect(renderDelegated('targetInReverseOrder', 'identicalShape')).toEqual(themeShape)
    })

    it('renders the @deco.Virtual shape on every render, also after rendering a target directly', () => {
      expect(renderDelegated('target', 'identicalObjectVirtual')).toEqual(labelShape)
      expect(renderDelegated('target', 'identicalObjectVirtual')).toEqual(labelShape)
      expect(renderOnTarget(PolymorphicShapeTargetB, 'identicalObjectVirtual')).toEqual(labelShape)
      expect(renderDelegated('target', 'identicalObjectVirtual')).toEqual(labelShape)
      expect(renderDelegated('targetInReverseOrder', 'identicalObjectVirtual')).toEqual(labelShape)
    })

    it('leaves each target model declaration as declared, in shorthand', () => {
      renderDelegated('target', 'identicalShape')
      renderOnTarget(PolymorphicShapeTargetB, 'identicalShape')
      renderDelegated('target', 'identicalObjectVirtual')
      renderOnTarget(PolymorphicShapeTargetB, 'identicalObjectVirtual')

      for (const target of [PolymorphicShapeTargetA, PolymorphicShapeTargetB]) {
        expect(DreamApp.system.modelDeclaredShape(target, 'identicalShape')?.shape).toEqual({
          type: 'object',
          properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: 'integer' },
        })
        expect(DreamApp.system.modelDeclaredShape(target, 'identicalObjectVirtual')?.shape).toEqual({
          type: 'object',
          properties: { label: 'string' },
        })
      }
    })
  })

  context('when the targets declare different @deco.JSON shapes', () => {
    it('throws, naming the serializer attribute, the association and each target model', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'differentShape')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }

      expect(() => renderDelegated('target', 'differentShape')).toThrow(
        /delegates "differentShape" through the polymorphic\nassociation "target"[\s\S]*\n {2}PolymorphicShapeTargetA: [\s\S]*\n {2}PolymorphicShapeTargetB: /,
      )
    })
  })

  context('when the targets differ in array-ness', () => {
    it('throws, though the declarations are identical', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'arrayOnB')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })
  })

  context('when a target lacks the declaration', () => {
    it('throws when a target model has no such attribute', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'onlyOnA')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('throws when a target leaves the json column undeclared', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'declaredOnlyOnA')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('throws when a target lacks a @deco.Virtual attribute the others declare', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'virtualOnlyOnA')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })
  })

  context('@deco.Virtual targets', () => {
    it('renders an identical declaration once, whatever the order of the targets', () => {
      for (const association of eitherOrder) {
        expect(renderDelegated(association, 'identicalVirtual')).toEqual({ type: ['string', 'null'] })
      }
    })

    it('throws when the declarations differ', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'differentVirtual')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('renders an explicit shape-carrying openapi override instead of throwing', () => {
      for (const association of eitherOrder) {
        expect(renderDelegated(association, 'differentVirtual', { openapi: 'string' })).toEqual({
          type: 'string',
        })
      }
    })

    it('renders the override when a target lacks the attribute', () => {
      for (const association of eitherOrder) {
        expect(renderDelegated(association, 'virtualOnlyOnA', { openapi: 'string' })).toEqual({
          type: 'string',
        })
      }
    })

    it('still throws for a description-only openapi, which is not an override', () => {
      expect(() =>
        renderDelegated('target', 'differentVirtual', { openapi: { description: 'a spec virtual' } }),
      ).toThrow(PolymorphicDelegatedAttributeShapesDiffer)
    })
  })

  context('@deco.Encrypted targets', () => {
    context('when the targets differ only in the nullability of their backing columns', () => {
      it('renders a bare @deco.Encrypted() nullable, whatever the order of the targets', () => {
        for (const association of eitherOrder) {
          expect(renderDelegated(association, 'bareSecret')).toEqual({ type: ['string', 'null'] })
        }
      })

      it('renders a declared shape nullable, whatever the order of the targets', () => {
        for (const association of eitherOrder) {
          const rendered = renderDelegated(association, 'integerSecret')
          expect(rendered).toEqual({ type: ['integer', 'null'] })
          expect(validates(rendered, null)).toBe(true)
          expect(validates(rendered, 5)).toBe(true)
        }
      })
    })

    context('when the targets describe the same values with null declared on some of them', () => {
      it('renders an identical ["string", "null"] over a nullable and a non-null column, whatever the order of the targets', () => {
        for (const association of eitherOrder) {
          expect(renderDelegated(association, 'nullableStringSecret')).toEqual({ type: ['string', 'null'] })
        }
      })

      it('renders a declared ["integer", "null"] beside "integer" over nullable columns, whatever the order of the targets', () => {
        for (const association of eitherOrder) {
          expect(renderDelegated(association, 'nullDeclaredOnASecret')).toEqual({ type: ['integer', 'null'] })
        }
      })

      it('renders a bare @deco.Encrypted() beside an explicit ["string", "null"] over a non-null column, whatever the order of the targets', () => {
        for (const association of eitherOrder) {
          expect(renderDelegated(association, 'explicitNullOnBSecret')).toEqual({ type: ['string', 'null'] })
        }
      })

      it('renders an object-form { type: ["integer", "null"] } beside "integer" over a non-null column nullable, whatever the order of the targets', () => {
        for (const association of eitherOrder) {
          const rendered = renderDelegated(association, 'objectFormNullOnASecret')
          expect(rendered).toEqual({ type: ['integer', 'null'] })
          expect(validates(rendered, null)).toBe(true)
        }
      })
    })

    it('throws when the declared shapes differ', () => {
      for (const association of eitherOrder) {
        expect(() => renderDelegated(association, 'mismatchedSecret')).toThrow(
          PolymorphicDelegatedAttributeShapesDiffer,
        )
      }
    })

    it('names each target declaration as declared when the shapes differ', () => {
      expect(() => renderDelegated('target', 'mismatchedSecret')).toThrow(
        /\n {2}PolymorphicShapeTargetA: @deco\.Encrypted \["string","null"\]\n {2}PolymorphicShapeTargetB: @deco\.Encrypted \["integer","null"\]\n/,
      )
    })

    context('when another target declares the attribute with @deco.Virtual', () => {
      it('renders the shape when the effective shapes are identical, whatever the order of the targets', () => {
        // a bare @deco.Encrypted() over a nullable column renders
        // ['string', 'null'], as the @deco.Virtual on the other target does
        for (const association of eitherOrder) {
          expect(renderDelegated(association, 'virtualOnBSecret')).toEqual({ type: ['string', 'null'] })
        }
      })

      it('throws when the backing column adds null the @deco.Virtual shape lacks', () => {
        for (const association of eitherOrder) {
          expect(() => renderDelegated(association, 'integerVirtualOnBSecret')).toThrow(
            PolymorphicDelegatedAttributeShapesDiffer,
          )
        }
      })

      it('names the null the backing column adds to the @deco.Encrypted shape', () => {
        expect(() => renderDelegated('target', 'integerVirtualOnBSecret')).toThrow(
          /\n {2}PolymorphicShapeTargetA: @deco\.Encrypted "integer", rendered as {"type":\["integer","null"\]}\n {2}PolymorphicShapeTargetB: @deco\.Virtual "integer"\n/,
        )
      })
    })
  })

  context('a plain column', () => {
    // the plain-column polymorphic case is outside this rule and unchanged:
    // it renders the first target's column, whatever the other targets hold.
    // plainColumn is a varchar on PolymorphicShapeTargetA and an integer on
    // PolymorphicShapeTargetB
    it('renders the first target column without comparing the targets', () => {
      expect(renderDelegated('target', 'plainColumn')).toEqual(
        renderOnTarget(PolymorphicShapeTargetA, 'plainColumn'),
      )
      expect(renderDelegated('targetInReverseOrder', 'plainColumn')).toEqual(
        renderOnTarget(PolymorphicShapeTargetB, 'plainColumn'),
      )
      expect(renderDelegated('target', 'plainColumn')).not.toEqual(
        renderDelegated('targetInReverseOrder', 'plainColumn'),
      )
    })
  })
})

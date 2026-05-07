import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import { validateObject } from '../../../../../src/helpers/validateOpenApiSchema.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'

describe('SerializerOpenapiRenderer flatten allOf payload validation', () => {
  it('accepts a payload that includes properties contributed by a flattened literal allOf sibling', () => {
    const ParentSerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
        .attribute('species')
        .customAttribute('localizedText', () => null, {
          flatten: true,
          openapi: {
            type: 'object',
            required: ['subtitle', 'title'],
            properties: {
              subtitle: { type: ['string', 'null'] },
              title: { type: ['string', 'null'] },
            },
          },
        })

    const renderer = new SerializerOpenapiRenderer(ParentSerializer)
    const renderedSchema = renderer.renderedOpenapi().openapi

    const payload = {
      species: 'cat',
      subtitle: 'My subtitle',
      title: 'My title',
    }

    const result = validateObject(payload, renderedSchema as object, { removeAdditional: false })

    expect(result.errors).toBeUndefined()
    expect(result.isValid).toBe(true)
  })

  it('accepts a payload that includes properties from a $ref-bundled flattened sibling whose own schema has a property lock', () => {
    // Mirrors the wellos failure: an inline branch + a $ref'd sibling schema that
    // declares its own `unevaluatedProperties: false`. Without the renderer fix,
    // properties contributed by either branch are rejected as "additional" by the
    // other branch.
    const SiblingSerializer = (data: User) => DreamSerializer(User, data).attribute('email').attribute('name')
    ;(SiblingSerializer as unknown as { globalName: string; openapiName: string }).globalName =
      'FlattenSiblingSerializer'
    ;(SiblingSerializer as unknown as { globalName: string; openapiName: string }).openapiName =
      'FlattenSibling'

    const ParentSerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
        .attribute('species')
        .customAttribute('flattened', () => null, {
          flatten: true,
          openapi: { $serializer: SiblingSerializer },
        })

    const parentRenderer = new SerializerOpenapiRenderer(ParentSerializer)
    const parentSchema = parentRenderer.renderedOpenapi().openapi

    const siblingRenderer = new SerializerOpenapiRenderer(SiblingSerializer)
    const siblingSchema = siblingRenderer.renderedOpenapi().openapi

    const schemaWithComponents = {
      ...(parentSchema as object),
      components: {
        schemas: {
          FlattenSibling: siblingSchema,
        },
      },
    }

    const payload = {
      species: 'cat',
      email: 'a@b.com',
      name: 'A',
    }

    const result = validateObject(payload, schemaWithComponents, { removeAdditional: false })

    expect(result.errors).toBeUndefined()
    expect(result.isValid).toBe(true)
  })

  it('rejects an unknown property at the wrapper level via unevaluatedProperties', () => {
    const ParentSerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
        .attribute('species')
        .customAttribute('localizedText', () => null, {
          flatten: true,
          openapi: {
            type: 'object',
            required: ['subtitle', 'title'],
            properties: {
              subtitle: { type: ['string', 'null'] },
              title: { type: ['string', 'null'] },
            },
          },
        })

    const renderer = new SerializerOpenapiRenderer(ParentSerializer)
    const renderedSchema = renderer.renderedOpenapi().openapi

    const payload = {
      species: 'cat',
      subtitle: 'My subtitle',
      title: 'My title',
      somethingMadeUp: 'should be rejected',
    }

    const result = validateObject(payload, renderedSchema as object, { removeAdditional: false })

    expect(result.isValid).toBe(false)
    expect(result.errors?.[0]?.params).toMatchObject({ unevaluatedProperty: 'somethingMadeUp' })
  })
})

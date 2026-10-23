import fastJsonStringify from 'fast-json-stringify'
import schemaForFastJsonStringify from '../../../../src/openapi-renderer/helpers/schemaForFastJsonStringify.js'

describe('schemaForFastJsonStringify', () => {
  const contactRef = { $ref: '#/components/schemas/Contact' }
  const billingRef = { $ref: '#/components/schemas/Billing' }
  const nullFields = (...keys: string[]) => ({
    type: 'object',
    properties: Object.fromEntries(keys.map(key => [key, { type: 'null' }])),
  })

  // a serializer with two flattened nullable serializers, as the OpenAPI document renders it
  const flattenedSchema = {
    $ref: '#/components/schemas/Pet',
    components: {
      schemas: {
        Pet: {
          type: 'object',
          allOf: [
            { type: 'object', required: ['species'], properties: { species: { type: 'string' } } },
            { anyOf: [contactRef, nullFields('email')] },
            { anyOf: [billingRef, nullFields('iban')] },
          ],
        },
        Contact: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } },
        Billing: { type: 'object', required: ['iban'], properties: { iban: { type: 'string' } } },
      },
    },
  }

  it('wraps each $ref that is a branch of an anyOf or oneOf in an allOf, wherever it is, and nothing else', () => {
    expect(
      schemaForFastJsonStringify({
        anyOf: [contactRef, { type: 'null' }],
        properties: {
          contact: contactRef,
          either: { oneOf: [contactRef, billingRef] },
          list: { type: 'array', items: { anyOf: [contactRef, { type: 'string', enum: ['a'] }] } },
        },
        allOf: [contactRef, { anyOf: [billingRef] }],
      }),
    ).toEqual({
      anyOf: [{ allOf: [contactRef] }, { type: 'null' }],
      properties: {
        contact: contactRef,
        either: { oneOf: [{ allOf: [contactRef] }, { allOf: [billingRef] }] },
        list: { type: 'array', items: { anyOf: [{ allOf: [contactRef] }, { type: 'string', enum: ['a'] }] } },
      },
      allOf: [contactRef, { anyOf: [{ allOf: [billingRef] }] }],
    })
  })

  it('does not mutate the schema it is given', () => {
    const schema = { anyOf: [contactRef, { type: 'null' }] }
    schemaForFastJsonStringify(schema)
    expect(schema).toEqual({ anyOf: [{ $ref: '#/components/schemas/Contact' }, { type: 'null' }] })
  })

  it('makes fast-json-stringify send the fields of the $refs in anyOfs it merges, which it drops from the document’s own schema', () => {
    const payload = { species: 'cat', email: 'a@b.c', iban: 'FR76' }
    const stringify = (schema: object): ((doc: unknown) => string) =>
      fastJsonStringify(schema, { ajv: { validateFormats: false } })

    expect(JSON.parse(stringify(flattenedSchema)(payload))).toEqual({ species: 'cat' })
    expect(JSON.parse(stringify(schemaForFastJsonStringify(flattenedSchema))(payload))).toEqual(payload)
  })
})

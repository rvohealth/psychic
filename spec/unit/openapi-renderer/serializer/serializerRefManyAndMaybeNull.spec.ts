/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ObjectSerializer } from '@rvoh/dream'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '@rvoh/dream/types'
import { validateObject } from '../../../../src/helpers/validateOpenApiSchema.js'
import OpenapiSegmentExpander from '../../../../src/openapi-renderer/body-segment.js'
import { OpenapiRenderOpts } from '../../../../src/openapi-renderer/endpoint.js'
import SerializerOpenapiRenderer from '../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import BalloonLatex from '../../../../test-app/src/app/models/Balloon/Latex.js'
import BalloonMylar from '../../../../test-app/src/app/models/Balloon/Mylar.js'
import User from '../../../../test-app/src/app/models/User.js'
import LatexSerializer from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'

type Serializer = DreamModelSerializerType | SimpleObjectSerializerType

const renderOpts: OpenapiRenderOpts = {
  casing: 'camel',
  suppressResponseEnums: false,
  legacyImplicitRequestBodyParams: false,
}

function named<T extends Serializer>(serializer: T, openapiName: string): T {
  ;(serializer as any).globalName = `${openapiName}Serializer`
  ;(serializer as any).openapiName = openapiName
  return serializer
}

// the components a document gets for this serializer, built as endpoint.ts
// `serializersToSchemaObjects` builds them: each referenced serializer's
// rendered OpenAPI, expanded as a response
function documentComponents(serializer: Serializer): Record<string, object> {
  const schemas: Record<string, object> = {}
  const pending: Serializer[] = [serializer]

  while (pending.length) {
    const next = pending.shift()!
    const renderer = new SerializerOpenapiRenderer(next, renderOpts)
    if (schemas[renderer.openapiName]) continue

    const results = renderer.renderedOpenapi()
    schemas[renderer.openapiName] = new OpenapiSegmentExpander(results.openapi, {
      renderOpts,
      target: 'response',
    }).render().openapi as object
    pending.push(...results.referencedSerializers)
  }

  return schemas
}

function wire(payload: unknown) {
  return JSON.parse(JSON.stringify(payload)) as unknown
}

// validates as response validation does: against the serializer's component in the document
function validateAgainstDocument(payload: unknown, serializer: Serializer) {
  return validateObject(
    wire(payload),
    {
      $ref: `#/components/schemas/${new SerializerOpenapiRenderer(serializer).openapiName}`,
      components: { schemas: documentComponents(serializer) },
    },
    { removeAdditional: false },
  )
}

// validates against the renderer's own schema, which keeps the flattened allOf
// wrapper's `unevaluatedProperties: false` (as flattenAllOfValidation.spec.ts does)
function validateAgainstRenderedSchema(payload: unknown, serializer: Serializer) {
  return validateObject(
    wire(payload),
    {
      ...(new SerializerOpenapiRenderer(serializer, renderOpts).renderedOpenapi().openapi as object),
      components: { schemas: documentComponents(serializer) },
    },
    { removeAdditional: false },
  )
}

interface Room {
  id: string
}

const RoomSerializer = named(
  (data: Room) => ObjectSerializer(data).attribute('id', { openapi: 'string' }),
  'Room',
)

const room = (id: string) => RoomSerializer({ id }).render() as Room

describe('serializer attributes whose openapi is a serializer ref with many and/or maybeNull', () => {
  context('$serializer', () => {
    const HotelSerializer = named(
      (data: { rooms: unknown; room: unknown; maybeRooms: unknown }) =>
        ObjectSerializer(data)
          .customAttribute('rooms', () => data.rooms, {
            openapi: { $serializer: RoomSerializer, many: true },
          })
          .customAttribute('room', () => data.room, {
            openapi: { $serializer: RoomSerializer, maybeNull: true },
          })
          .customAttribute('maybeRooms', () => data.maybeRooms, {
            openapi: { $serializer: RoomSerializer, many: true, maybeNull: true },
          }),
      'Hotel',
    )

    it('renders many as an array of the ref, maybeNull as nullable, and both as a nullable array', () => {
      expect(
        new SerializerOpenapiRenderer(HotelSerializer)['renderedOpenapiAttributes']().attributes,
      ).toEqual({
        rooms: { type: 'array', items: { $ref: '#/components/schemas/Room' } },
        room: { anyOf: [{ $ref: '#/components/schemas/Room' }, { type: 'null' }] },
        maybeRooms: { type: ['array', 'null'], items: { $ref: '#/components/schemas/Room' } },
      })
    })

    it('validates the payloads those attributes render, including arrays and null', () => {
      const valid = (data: { rooms: unknown; room: unknown; maybeRooms: unknown }) =>
        validateAgainstDocument(HotelSerializer(data).render(), HotelSerializer).isValid

      expect(valid({ rooms: [room('1'), room('2')], room: room('3'), maybeRooms: [room('4')] })).toBe(true)
      expect(valid({ rooms: [], room: null, maybeRooms: null })).toBe(true)

      expect(valid({ rooms: null, room: null, maybeRooms: null })).toBe(false)
      expect(valid({ rooms: room('1'), room: null, maybeRooms: null })).toBe(false)
      expect(valid({ rooms: [], room: [room('1')], maybeRooms: null })).toBe(false)
      expect(valid({ rooms: [], room: null, maybeRooms: room('1') })).toBe(false)
    })

    it('applies to an attribute’s openapi too', () => {
      const MySerializer = named(
        (data: { rooms: Room[] }) =>
          ObjectSerializer(data).attribute('rooms', { openapi: { $serializer: RoomSerializer, many: true } }),
        'AttributeRooms',
      )

      expect(new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes).toEqual({
        rooms: { type: 'array', items: { $ref: '#/components/schemas/Room' } },
      })
      expect(
        validateAgainstDocument(MySerializer({ rooms: [room('1')] }).render(), MySerializer).isValid,
      ).toBe(true)
    })

    context('on an optional delegatedAttribute', () => {
      it('adds null to a many once, and does not wrap a maybeNull in a second anyOf', () => {
        const MySerializer = named(
          (data: { hotel: { rooms: Room[]; room: Room } | null }) =>
            ObjectSerializer(data)
              .delegatedAttribute('hotel', 'rooms', {
                openapi: { $serializer: RoomSerializer, many: true },
                optional: true,
              })
              .delegatedAttribute('hotel', 'room', {
                openapi: { $serializer: RoomSerializer, maybeNull: true },
                optional: true,
              }),
          'DelegatedRooms',
        )

        expect(new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes).toEqual(
          {
            rooms: { type: ['array', 'null'], items: { $ref: '#/components/schemas/Room' } },
            room: { anyOf: [{ $ref: '#/components/schemas/Room' }, { type: 'null' }] },
          },
        )
        expect(validateAgainstDocument(MySerializer({ hotel: null }).render(), MySerializer).isValid).toBe(
          true,
        )
      })
    })
  })

  context('$serializable', () => {
    context('resolving to one serializer', () => {
      it('renders many, maybeNull, and both as for $serializer', () => {
        const MySerializer = (data: object) =>
          ObjectSerializer(data)
            .customAttribute('users', () => null, { openapi: { $serializable: User, many: true } })
            .customAttribute('user', () => null, { openapi: { $serializable: User, maybeNull: true } })
            .customAttribute('maybeUsers', () => null, {
              openapi: { $serializable: User, many: true, maybeNull: true },
            })

        expect(new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes).toEqual(
          {
            users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            user: { anyOf: [{ $ref: '#/components/schemas/User' }, { type: 'null' }] },
            maybeUsers: { type: ['array', 'null'], items: { $ref: '#/components/schemas/User' } },
          },
        )
      })
    })

    context('an STI base model', () => {
      const FleetSerializer = named(
        (data: { balloons: unknown; balloon: unknown; maybeBalloons: unknown }) =>
          ObjectSerializer(data)
            .customAttribute('balloons', () => data.balloons, {
              openapi: { $serializable: Balloon, many: true },
            })
            .customAttribute('balloon', () => data.balloon, {
              openapi: { $serializable: Balloon, maybeNull: true },
            })
            .customAttribute('maybeBalloons', () => data.maybeBalloons, {
              openapi: { $serializable: Balloon, many: true, maybeNull: true },
            }),
        'Fleet',
      )

      const stiRefs = [
        { $ref: '#/components/schemas/BalloonLatex' },
        { $ref: '#/components/schemas/BalloonMylar' },
      ]

      it('renders many as an array of anyOf the child refs, and maybeNull adds null to the anyOf', () => {
        expect(
          new SerializerOpenapiRenderer(FleetSerializer)['renderedOpenapiAttributes']().attributes,
        ).toEqual({
          balloons: { type: 'array', items: { anyOf: stiRefs } },
          balloon: { anyOf: [...stiRefs, { type: 'null' }] },
          maybeBalloons: { type: ['array', 'null'], items: { anyOf: stiRefs } },
        })
      })

      it('validates the payloads those attributes render, including arrays and null', async () => {
        const user = await User.create({ email: 'a@b.c', password: 'howyadoin' })
        const latex = LatexSerializer(await BalloonLatex.create({ color: 'red', user }), {}).render()
        const mylar = MylarSerializer(await BalloonMylar.create({ color: 'blue', user }), {}).render()

        const valid = (data: { balloons: unknown; balloon: unknown; maybeBalloons: unknown }) =>
          validateAgainstDocument(FleetSerializer(data).render(), FleetSerializer).isValid

        expect(valid({ balloons: [latex, mylar], balloon: mylar, maybeBalloons: [mylar, latex] })).toBe(true)
        expect(valid({ balloons: [], balloon: null, maybeBalloons: null })).toBe(true)

        expect(valid({ balloons: null, balloon: null, maybeBalloons: null })).toBe(false)
        expect(valid({ balloons: latex, balloon: null, maybeBalloons: null })).toBe(false)
        expect(valid({ balloons: [], balloon: [latex], maybeBalloons: null })).toBe(false)
      })
    })
  })

  context('flattened', () => {
    interface Contact {
      email: string
      name: string
    }

    const ContactSerializer = named(
      (data: Contact) =>
        ObjectSerializer(data)
          .attribute('email', { openapi: 'string' })
          .attribute('name', { openapi: 'string' }),
      'Contact',
    )

    const contactRef = { $ref: '#/components/schemas/Contact' }
    const contactFieldsNull = {
      type: 'object',
      properties: { email: { type: 'null' }, name: { type: 'null' } },
    }

    const parentInline = {
      type: 'object',
      required: ['species'],
      properties: { species: { type: 'string' } },
    }

    // what Dream sends for each case, and what a valid schema must say about it
    const presentPayload = { species: 'cat', email: 'a@b.c', name: 'A' }
    const fieldsOmittedPayload = { species: 'cat' } // a flattened customAttribute whose value is null
    const fieldsNullPayload = { species: 'cat', email: null, name: null } // a flattened rendersOne that is null
    const partialPayload = { species: 'cat', email: 'a@b.c' }
    const unknownKeyPayload = { species: 'cat', bogus: 1 }

    function expectFlattenedNullableValidation(serializer: Serializer) {
      expect(validateAgainstRenderedSchema(presentPayload, serializer).errors).toBeUndefined()
      expect(validateAgainstRenderedSchema(fieldsOmittedPayload, serializer).errors).toBeUndefined()
      expect(validateAgainstRenderedSchema(fieldsNullPayload, serializer).errors).toBeUndefined()
      expect(validateAgainstRenderedSchema(partialPayload, serializer).isValid).toBe(false)
      expect(validateAgainstRenderedSchema(unknownKeyPayload, serializer).isValid).toBe(false)

      expect(validateAgainstDocument(presentPayload, serializer).errors).toBeUndefined()
      expect(validateAgainstDocument(fieldsOmittedPayload, serializer).errors).toBeUndefined()
      expect(validateAgainstDocument(fieldsNullPayload, serializer).errors).toBeUndefined()
      expect(validateAgainstDocument(partialPayload, serializer).isValid).toBe(false)
    }

    context('a customAttribute with flatten and a maybeNull $serializer', () => {
      const PetSerializer = named(
        (data: { species: string; contact: Contact | null }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute(
              'contact',
              () => (data.contact ? ContactSerializer(data.contact).render() : null),
              {
                flatten: true,
                openapi: { $serializer: ContactSerializer, maybeNull: true },
              },
            ),
        'FlattenedMaybeNullContactPet',
      )

      it('is the nested serializer, or an object whose nested fields, when present, are null', () => {
        const results = new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi()
        expect(results.openapi).toEqual({
          type: 'object',
          allOf: [parentInline, { anyOf: [contactRef, contactFieldsNull] }],
          unevaluatedProperties: false,
        })
        expect(results.referencedSerializers).toEqual([ContactSerializer])
      })

      it('validates the payloads Dream renders, and the nested fields as null', () => {
        expect(PetSerializer({ species: 'cat', contact: { email: 'a@b.c', name: 'A' } }).render()).toEqual(
          presentPayload,
        )
        expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual(fieldsOmittedPayload)

        expectFlattenedNullableValidation(PetSerializer)
      })
    })

    context('a customAttribute with flatten and a maybeNull $serializable STI base model', () => {
      it('is any of the child serializers, or an object whose fields from every child, when present, are null', () => {
        const MySerializer = (data: { species: string }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute('balloon', () => null, {
              flatten: true,
              openapi: { $serializable: Balloon, maybeNull: true },
            })

        expect(new SerializerOpenapiRenderer(MySerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              anyOf: [
                { $ref: '#/components/schemas/BalloonLatex' },
                { $ref: '#/components/schemas/BalloonMylar' },
                {
                  type: 'object',
                  properties: {
                    color: { type: 'null' },
                    id: { type: 'null' },
                    latexOnlyAttr: { type: 'null' },
                    mylarOnlyAttr: { type: 'null' },
                  },
                },
              ],
            },
          ],
          unevaluatedProperties: false,
        })
      })
    })

    context('a rendersOne with flatten and optional', () => {
      const PetSerializer = named(
        (data: { species: string; contact: Contact | null }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .rendersOne('contact', { serializer: ContactSerializer, flatten: true, optional: true }),
        'FlattenedOptionalContactPet',
      )

      it('is the nested serializer, or an object whose nested fields, when present, are null', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [parentInline, { anyOf: [contactRef, contactFieldsNull] }],
          unevaluatedProperties: false,
        })
      })

      it('validates the payloads Dream renders, and the nested fields omitted', () => {
        expect(PetSerializer({ species: 'cat', contact: { email: 'a@b.c', name: 'A' } }).render()).toEqual(
          presentPayload,
        )
        expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual(fieldsNullPayload)

        expectFlattenedNullableValidation(PetSerializer)
      })
    })

    it('includes the fields the nested serializer flattens into itself', () => {
      const AddressSerializer = named(
        (data: { city: string }) => ObjectSerializer(data).attribute('city', { openapi: 'string' }),
        'Address',
      )
      const ContactWithAddressSerializer = named(
        (data: { email: string; address: { city: string } }) =>
          ObjectSerializer(data)
            .attribute('email', { openapi: 'string' })
            .rendersOne('address', { serializer: AddressSerializer, flatten: true })
            .customAttribute('phone', () => null, {
              flatten: true,
              openapi: { type: 'object', properties: { phoneNumber: 'string' } },
            }),
        'ContactWithAddress',
      )
      const MySerializer = (data: {
        species: string
        contact: { email: string; address: { city: string } } | null
      }) =>
        ObjectSerializer(data)
          .attribute('species', { openapi: 'string' })
          .rendersOne('contact', { serializer: ContactWithAddressSerializer, flatten: true, optional: true })

      expect(new SerializerOpenapiRenderer(MySerializer).renderedOpenapi().openapi).toEqual({
        type: 'object',
        allOf: [
          parentInline,
          {
            anyOf: [
              { $ref: '#/components/schemas/ContactWithAddress' },
              {
                type: 'object',
                properties: {
                  city: { type: 'null' },
                  email: { type: 'null' },
                  phoneNumber: { type: 'null' },
                },
              },
            ],
          },
        ],
        unevaluatedProperties: false,
      })
    })

    it('cases the nested field names as the serializer is cased', () => {
      const NameSerializer = named(
        (data: { firstName: string }) => ObjectSerializer(data).attribute('firstName', { openapi: 'string' }),
        'PersonName',
      )
      const MySerializer = (data: { name: { firstName: string } | null }) =>
        ObjectSerializer(data).rendersOne('name', {
          serializer: NameSerializer,
          flatten: true,
          optional: true,
        })

      expect(
        new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' }).renderedOpenapi().openapi,
      ).toEqual({
        type: 'object',
        allOf: [
          { type: 'object', required: [], properties: {} },
          {
            anyOf: [
              { $ref: '#/components/schemas/PersonName' },
              { type: 'object', properties: { first_name: { type: 'null' } } },
            ],
          },
        ],
        unevaluatedProperties: false,
      })
    })
  })
})

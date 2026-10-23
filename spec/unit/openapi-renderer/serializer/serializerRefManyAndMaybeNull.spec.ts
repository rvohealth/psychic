/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ObjectSerializer } from '@rvoh/dream'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '@rvoh/dream/types'
import fastJsonStringify from 'fast-json-stringify'
import { validateObject } from '../../../../src/helpers/validateOpenApiSchema.js'
import OpenapiEndpointRenderer, {
  OpenapiRenderOpts,
  ToSchemaObjectOpts,
} from '../../../../src/openapi-renderer/endpoint.js'
import schemaForFastJsonStringify from '../../../../src/openapi-renderer/helpers/schemaForFastJsonStringify.js'
import SerializerOpenapiRenderer from '../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import BalloonLatex from '../../../../test-app/src/app/models/Balloon/Latex.js'
import BalloonMylar from '../../../../test-app/src/app/models/Balloon/Mylar.js'
import User from '../../../../test-app/src/app/models/User.js'
import LatexSerializer from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'
import { BalloonColorsEnumValues } from '../../../../test-app/src/types/db.js'

type Serializer = DreamModelSerializerType | SimpleObjectSerializerType

// the Balloon serializers' `color`, a nullable enum column
const balloonColor = { type: ['string', 'null'], enum: [...BalloonColorsEnumValues, null] }

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

// the components the OpenAPI document gets for this serializer, built by the
// endpoint renderer as the document build does: each referenced serializer's
// rendered OpenAPI, expanded as a response
function documentComponents(serializer: Serializer): Record<string, object> {
  const toSchemaObjectOpts: ToSchemaObjectOpts = {
    openapiName: 'default',
    renderOpts,
    alreadyExtractedDescendantSerializers: {},
    renderedSchemasOpenapi: {},
    serializersAppearingInHandWrittenOpenapi: [],
  }
  new OpenapiEndpointRenderer(serializer, UsersController, 'howyadoin', {}).toSchemaObject(toSchemaObjectOpts)
  return toSchemaObjectOpts.renderedSchemasOpenapi as Record<string, object>
}

// the response schema of an endpoint rendering this serializer, with the document's components
function documentSchema(serializer: Serializer) {
  return {
    $ref: `#/components/schemas/${new SerializerOpenapiRenderer(serializer).openapiName}`,
    components: { schemas: documentComponents(serializer) },
  }
}

function wire(payload: unknown) {
  return JSON.parse(JSON.stringify(payload)) as unknown
}

// validates as response validation does: against the serializer's component in the document
function validateAgainstDocument(payload: unknown, serializer: Serializer) {
  return validateObject(wire(payload), documentSchema(serializer), { removeAdditional: false })
}

// serializes as an endpoint with `fastJsonStringify: true` does: with fast-json-stringify,
// compiled from the response schema as PsychicController#getFastJsonStringifyFunction compiles it
function stringifyAgainstDocument(payload: unknown, serializer: Serializer) {
  const stringify = fastJsonStringify(schemaForFastJsonStringify(documentSchema(serializer)), {
    ajv: { validateFormats: false },
  })
  return JSON.parse(stringify(payload)) as unknown
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

    // the nested serializer's fields, which every payload carries, null when
    // the flattened value is null
    const contactFieldsNullable = {
      type: 'object',
      required: ['email', 'name'],
      properties: { email: { type: ['string', 'null'] }, name: { type: ['string', 'null'] } },
    }

    const parentInline = {
      type: 'object',
      required: ['species'],
      properties: { species: { type: 'string' } },
    }

    // what Dream sends for each case, and what a valid schema must say about it
    const presentPayload = { species: 'cat', email: 'a@b.c', name: 'A' }
    const fieldsNullPayload = { species: 'cat', email: null, name: null } // a flattened value that is null
    const fieldsOmittedPayload = { species: 'cat' } // a flattened customAttribute with `required: false` whose callback returns undefined
    const fieldsOmittedPayloadSerializer = named(
      (data: { species: string; contact?: Contact }) =>
        ObjectSerializer(data)
          .attribute('species', { openapi: 'string' })
          .customAttribute(
            'contact',
            () => (data.contact ? ContactSerializer(data.contact).render() : undefined),
            {
              flatten: true,
              required: false,
              openapi: { $serializer: ContactSerializer, maybeNull: true },
            },
          ),
      'FlattenedOptionalContactPetOmitting',
    )
    const partialPayload = { species: 'cat', email: 'a@b.c' }
    const unknownKeyPayload = { species: 'cat', bogus: 1 }

    // each payload passes response validation and is sent as is by an endpoint with `fastJsonStringify: true`
    function expectValidatedAndSerialized(serializer: Serializer, payloads: unknown[]) {
      for (const payload of payloads) {
        expect(validateAgainstRenderedSchema(payload, serializer).errors).toBeUndefined()
        expect(validateAgainstDocument(payload, serializer).errors).toBeUndefined()
        expect(stringifyAgainstDocument(payload, serializer)).toEqual(payload)
      }
    }

    function expectFlattenedNullableValidation(serializer: Serializer) {
      expectValidatedAndSerialized(serializer, [presentPayload, fieldsNullPayload])

      expect(validateAgainstRenderedSchema(partialPayload, serializer).isValid).toBe(false)
      expect(validateAgainstRenderedSchema(fieldsOmittedPayload, serializer).isValid).toBe(false)
      expect(validateAgainstRenderedSchema(unknownKeyPayload, serializer).isValid).toBe(false)
      expect(validateAgainstDocument(partialPayload, serializer).isValid).toBe(false)
    }

    context('a customAttribute with flatten and required: false', () => {
      it('still accepts null for each key its hand-written shape requires, since Dream renders one a present value leaves out as null', () => {
        const MySerializer = named(
          (data: { species: string; phone?: { phoneNumber: string; extension?: string } }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .customAttribute('phone', () => data.phone, {
                flatten: true,
                required: false,
                openapi: {
                  type: 'object',
                  required: ['phoneNumber', 'extension'],
                  properties: { phoneNumber: { type: 'string' }, extension: { type: 'string' } },
                },
              }),
          'FlattenedOptionalPhonePet',
        )

        expect(new SerializerOpenapiRenderer(MySerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              properties: {
                phoneNumber: { type: ['string', 'null'] },
                extension: { type: ['string', 'null'] },
              },
            },
          ],
          unevaluatedProperties: false,
        })

        const partial = MySerializer({ species: 'cat', phone: { phoneNumber: '555' } }).render()
        const omitted = MySerializer({ species: 'cat' }).render()
        expect(partial).toEqual({ species: 'cat', phoneNumber: '555', extension: null })
        expect(omitted).toEqual({ species: 'cat' })
        expectValidatedAndSerialized(MySerializer, [partial, omitted])
      })

      it('requires none of the nested fields, since Dream adds nothing for a callback returning undefined', () => {
        expect(
          new SerializerOpenapiRenderer(fieldsOmittedPayloadSerializer).renderedOpenapi().openapi,
        ).toEqual({
          type: 'object',
          allOf: [parentInline, { ...contactFieldsNullable, required: undefined }],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends the payloads Dream renders, with the nested fields present or omitted', () => {
        expect(
          fieldsOmittedPayloadSerializer({ species: 'cat', contact: { email: 'a@b.c', name: 'A' } }).render(),
        ).toEqual(presentPayload)
        expect(fieldsOmittedPayloadSerializer({ species: 'cat' }).render()).toEqual(fieldsOmittedPayload)

        expectValidatedAndSerialized(fieldsOmittedPayloadSerializer, [presentPayload, fieldsOmittedPayload])
      })
    })

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

      it('is an object of the nested serializer’s fields, each accepting null', () => {
        const results = new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi()
        expect(results.openapi).toEqual({
          type: 'object',
          allOf: [parentInline, contactFieldsNullable],
          unevaluatedProperties: false,
        })
        expect(results.referencedSerializers).toEqual([ContactSerializer])
      })

      it('validates the payloads Dream renders, and the nested fields as null', () => {
        expect(PetSerializer({ species: 'cat', contact: { email: 'a@b.c', name: 'A' } }).render()).toEqual(
          presentPayload,
        )
        expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual(fieldsNullPayload)

        expectFlattenedNullableValidation(PetSerializer)
      })
    })

    context('a customAttribute with flatten and a maybeNull $serializable STI base model', () => {
      it('is an object of every child serializer’s fields, each accepting null', () => {
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
              type: 'object',
              required: ['color', 'id', 'latexOnlyAttr', 'mylarOnlyAttr'],
              properties: {
                color: balloonColor,
                id: { type: ['string', 'null'], format: 'bigint' },
                latexOnlyAttr: { type: ['string', 'null'] },
                mylarOnlyAttr: { type: ['string', 'null'] },
              },
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

      it('is an object of the nested serializer’s fields, each accepting null', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [parentInline, contactFieldsNullable],
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

    it('requires the fields Dream always sends, those the nested serializer requires through the serializers and shapes it flattens, each accepting null, and leaves a key it may omit optional', () => {
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
              openapi: {
                type: 'object',
                required: ['fax'],
                properties: { phoneNumber: 'string', fax: 'string' },
              },
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
            type: 'object',
            required: ['city', 'email', 'fax'],
            properties: {
              city: { type: ['string', 'null'] },
              email: { type: ['string', 'null'] },
              fax: { type: ['string', 'null'] },
              phoneNumber: { type: 'string' },
            },
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
            type: 'object',
            required: ['first_name'],
            properties: { first_name: { type: ['string', 'null'] } },
          },
        ],
        unevaluatedProperties: false,
      })
    })

    context('a rendersOne with flatten and optional whose serializer has an optional attribute', () => {
      const ContactWithNicknameSerializer = named(
        (data: { email: string; nickname?: string }) =>
          ObjectSerializer(data)
            .attribute('email', { openapi: 'string' })
            .attribute('nickname', { openapi: 'string', required: false }),
        'ContactWithNickname',
      )
      const PetSerializer = named(
        (data: { species: string; contact: { email: string; nickname?: string } | null }) =>
          ObjectSerializer(data).attribute('species', { openapi: 'string' }).rendersOne('contact', {
            serializer: ContactWithNicknameSerializer,
            flatten: true,
            optional: true,
          }),
        'FlattenedOptionalNicknamedContactPet',
      )

      it('requires only the required fields, since Dream omits an optional one of a null value, and leaves the optional one as written', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              required: ['email'],
              properties: { email: { type: ['string', 'null'] }, nickname: { type: 'string' } },
            },
          ],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends the payloads Dream renders', () => {
        const present = PetSerializer({ species: 'cat', contact: { email: 'a@b.c', nickname: 'A' } }).render()
        const absent = PetSerializer({ species: 'cat', contact: null }).render()
        expect(absent).toEqual({ species: 'cat', email: null })

        expectValidatedAndSerialized(PetSerializer, [present, absent])
      })
    })

    context('a customAttribute with flatten whose openapi is a hand-written shape', () => {
      interface Phone {
        phoneNumber: string
        extension?: string
        note?: string
      }

      const PetSerializer = named(
        (data: { species: string; phone: Phone }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute('phone', () => data.phone, {
              flatten: true,
              openapi: {
                type: 'object',
                required: ['phoneNumber', 'extension'],
                properties: {
                  phoneNumber: { type: 'string' },
                  extension: { type: 'string', description: 'the desk' },
                  note: { type: 'string' },
                },
              },
            }),
        'FlattenedPhonePet',
      )

      it('accepts null for each key the shape requires, since Dream renders one the callback leaves out as null, and leaves an optional key as written', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              required: ['extension', 'phoneNumber'],
              properties: {
                phoneNumber: { type: ['string', 'null'] },
                extension: { type: ['string', 'null'], description: 'the desk' },
                note: { type: 'string' },
              },
            },
          ],
          unevaluatedProperties: false,
        })
      })

      it('expands a shorthand property, widened to accept null when the shape requires it', () => {
        const MySerializer = (data: { phone: Phone }) =>
          ObjectSerializer(data).customAttribute('phone', () => data.phone, {
            flatten: true,
            openapi: {
              type: 'object',
              required: ['phoneNumber', 'extension', 'note'],
              properties: { phoneNumber: 'string', extension: ['string', 'null'], note: 'null' },
            },
          })

        expect(new SerializerOpenapiRenderer(MySerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            { type: 'object', required: [], properties: {} },
            {
              type: 'object',
              required: ['extension', 'note', 'phoneNumber'],
              properties: {
                phoneNumber: { type: ['string', 'null'] },
                extension: { type: ['string', 'null'] },
                note: { type: 'null' },
              },
            },
          ],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends the payloads Dream renders, with a required key the callback left out as null and an optional one absent', () => {
        const complete = PetSerializer({
          species: 'cat',
          phone: { phoneNumber: '555', extension: '12', note: 'desk' },
        }).render()
        const partial = PetSerializer({ species: 'cat', phone: { phoneNumber: '555' } }).render()
        expect(partial).toEqual({ species: 'cat', phoneNumber: '555', extension: null })

        expectValidatedAndSerialized(PetSerializer, [complete, partial])
      })

      it('cases the shape’s keys as the serializer is cased, as Dream renders them', () => {
        expect(
          new SerializerOpenapiRenderer(PetSerializer, { casing: 'snake' }).renderedOpenapi().openapi,
        ).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              required: ['extension', 'phone_number'],
              properties: {
                phone_number: { type: ['string', 'null'] },
                extension: { type: ['string', 'null'], description: 'the desk' },
                note: { type: 'string' },
              },
            },
          ],
          unevaluatedProperties: false,
        })

        expect(
          PetSerializer({ species: 'cat', phone: { phoneNumber: '555' } }).render(undefined, {
            casing: 'snake',
          }),
        ).toEqual({ species: 'cat', phone_number: '555', extension: null })
      })
    })

    context('a customAttribute with flatten whose openapi is anyOf hand-written shapes', () => {
      type Location = { city: string; zip?: string } | { iban: string }

      const PetSerializer = named(
        (data: { species: string; location: Location }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute('location', () => data.location, {
              flatten: true,
              openapi: {
                anyOf: [
                  {
                    type: 'object',
                    required: ['city'],
                    properties: { city: { type: 'string' }, zip: { type: 'string' } },
                  },
                  { type: 'object', required: ['iban'], properties: { iban: { type: 'string' } } },
                ],
              },
            }),
        'FlattenedLocationShapesPet',
      )

      it('is an object of every shape’s keys, the keys any shape requires required and accepting null, the others as written', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              required: ['city', 'iban'],
              properties: {
                city: { type: ['string', 'null'] },
                iban: { type: ['string', 'null'] },
                zip: { type: 'string' },
              },
            },
          ],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends the payloads Dream renders', () => {
        const city = PetSerializer({ species: 'cat', location: { city: 'Paris' } }).render()
        const cityAndZip = PetSerializer({
          species: 'cat',
          location: { city: 'Paris', zip: '75001' },
        }).render()
        const iban = PetSerializer({ species: 'cat', location: { iban: 'FR76' } }).render()
        const cityAndIban = PetSerializer({
          species: 'cat',
          location: { city: 'Paris', iban: 'FR76' } as Location,
        }).render()

        expect(city).toEqual({ species: 'cat', city: 'Paris', iban: null })
        expect(cityAndZip).toEqual({ species: 'cat', city: 'Paris', zip: '75001', iban: null })
        expect(iban).toEqual({ species: 'cat', iban: 'FR76', city: null })
        expect(cityAndIban).toEqual({ species: 'cat', city: 'Paris', iban: 'FR76' })

        expectValidatedAndSerialized(PetSerializer, [city, cityAndZip, iban, cityAndIban])
      })
    })

    context('a customAttribute with flatten whose openapi is anyOf a hand-written shape or null', () => {
      const PetSerializer = named(
        (data: { species: string; location: { city: string; zip?: string } | null }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute('location', () => data.location, {
              flatten: true,
              openapi: {
                anyOf: [
                  {
                    type: 'object',
                    required: ['city'],
                    properties: { city: { type: 'string' }, zip: { type: 'string' } },
                  },
                  { type: 'null' },
                ],
              },
            }),
        'FlattenedNullableLocationShapePet',
      )

      it('is the shape, its required keys accepting null', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              required: ['city'],
              properties: { city: { type: ['string', 'null'] }, zip: { type: 'string' } },
            },
          ],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends the payloads Dream renders', () => {
        const present = PetSerializer({ species: 'cat', location: { city: 'Paris', zip: '75001' } }).render()
        const absent = PetSerializer({ species: 'cat', location: null }).render()
        expect(absent).toEqual({ species: 'cat', city: null })

        expectValidatedAndSerialized(PetSerializer, [present, absent])
      })
    })

    context('beside another flattened nullable', () => {
      interface Address {
        city: string
      }

      const AddressSerializer = named(
        (data: Address) => ObjectSerializer(data).attribute('city', { openapi: 'string' }),
        'Address',
      )
      const BillingSerializer = named(
        (data: { iban: string }) => ObjectSerializer(data).attribute('iban', { openapi: 'string' }),
        'Billing',
      )

      const PetSerializer = named(
        (data: {
          species: string
          contact: Contact | null
          address: Address | null
          billing: { iban: string } | null
        }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute(
              'contact',
              () => (data.contact ? ContactSerializer(data.contact).render() : null),
              { flatten: true, openapi: { $serializer: ContactSerializer, maybeNull: true } },
            )
            .customAttribute(
              'address',
              () => (data.address ? AddressSerializer(data.address).render() : null),
              { flatten: true, openapi: { $serializer: AddressSerializer, maybeNull: true } },
            )
            .rendersOne('billing', { serializer: BillingSerializer, flatten: true, optional: true }),
        'FlattenedNullablesPet',
      )

      it('validates and sends every flattened field, whichever of them are null', () => {
        const contact = { email: 'a@b.c', name: 'A' }
        const address = { city: 'Paris' }
        const billing = { iban: 'FR76' }

        expect(PetSerializer({ species: 'cat', contact, address, billing }).render()).toEqual({
          species: 'cat',
          ...contact,
          ...address,
          ...billing,
        })

        const payloads = [contact, null].flatMap(contact =>
          [address, null].flatMap(address =>
            [billing, null].map(billing =>
              PetSerializer({ species: 'cat', contact, address, billing }).render(),
            ),
          ),
        )
        expectValidatedAndSerialized(PetSerializer, payloads)
      })
    })

    context('beside a flattened STI base model', () => {
      // every child's fields: the ones every child renders as they are, the
      // ones only one child renders accepting null
      const stiChildren = {
        type: 'object',
        required: ['color', 'id', 'latexOnlyAttr', 'mylarOnlyAttr'],
        properties: {
          color: balloonColor,
          id: { type: 'string', format: 'bigint' },
          latexOnlyAttr: { type: ['string', 'null'] },
          mylarOnlyAttr: { type: ['string', 'null'] },
        },
      }

      async function balloons() {
        const user = await User.create({ email: 'a@b.c', password: 'howyadoin' })
        return {
          latex: await BalloonLatex.create({ color: 'red', user }),
          mylar: await BalloonMylar.create({ color: 'blue', user }),
        }
      }

      context('in a rendersOne', () => {
        const PetSerializer = named(
          (data: { species: string; balloon: Balloon; contact: Contact | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .rendersOne('balloon', { dreamClass: Balloon, flatten: true })
              .customAttribute(
                'contact',
                () => (data.contact ? ContactSerializer(data.contact).render() : null),
                { flatten: true, openapi: { $serializer: ContactSerializer, maybeNull: true } },
              ),
          'FlattenedBalloonPet',
        )

        it('is an object of every child serializer’s fields', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [parentInline, stiChildren, contactFieldsNullable],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends every flattened field', async () => {
          const { latex, mylar } = await balloons()
          const contact = { email: 'a@b.c', name: 'A' }

          expect(PetSerializer({ species: 'cat', balloon: latex, contact }).render()).toEqual({
            species: 'cat',
            ...LatexSerializer(latex, {}).render(),
            mylarOnlyAttr: null,
            ...contact,
          })

          expectValidatedAndSerialized(PetSerializer, [
            PetSerializer({ species: 'cat', balloon: latex, contact }).render(),
            PetSerializer({ species: 'cat', balloon: mylar, contact: null }).render(),
          ])
        })
      })

      context('in a customAttribute $serializable', () => {
        const PetSerializer = named(
          (data: { species: string; balloon: BalloonLatex | BalloonMylar; contact: Contact | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .customAttribute(
                'balloon',
                () =>
                  data.balloon instanceof BalloonLatex
                    ? LatexSerializer(data.balloon, {}).render()
                    : MylarSerializer(data.balloon, {}).render(),
                { flatten: true, openapi: { $serializable: Balloon } },
              )
              .customAttribute(
                'contact',
                () => (data.contact ? ContactSerializer(data.contact).render() : null),
                { flatten: true, openapi: { $serializer: ContactSerializer, maybeNull: true } },
              ),
          'FlattenedSerializableBalloonPet',
        )

        it('is an object of every child serializer’s fields', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [parentInline, stiChildren, contactFieldsNullable],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends every flattened field', async () => {
          const { latex, mylar } = await balloons()

          expectValidatedAndSerialized(PetSerializer, [
            PetSerializer({
              species: 'cat',
              balloon: latex,
              contact: { email: 'a@b.c', name: 'A' },
            }).render(),
            PetSerializer({ species: 'cat', balloon: mylar, contact: null }).render(),
          ])
        })
      })
    })

    context('beside a flattened customAttribute whose openapi is anyOf serializer refs', () => {
      const AddressSerializer = named(
        (data: { city: string }) => ObjectSerializer(data).attribute('city', { openapi: 'string' }),
        'Address',
      )
      const BillingSerializer = named(
        (data: { iban: string }) => ObjectSerializer(data).attribute('iban', { openapi: 'string' }),
        'Billing',
      )

      const PetSerializer = named(
        (data: { species: string; location: { city: string } | { iban: string }; contact: Contact | null }) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: 'string' })
            .customAttribute('location', () => data.location, {
              flatten: true,
              openapi: { anyOf: [{ $serializer: AddressSerializer }, { $serializer: BillingSerializer }] },
            })
            .customAttribute(
              'contact',
              () => (data.contact ? ContactSerializer(data.contact).render() : null),
              { flatten: true, openapi: { $serializer: ContactSerializer, maybeNull: true } },
            ),
        'FlattenedLocationPet',
      )

      it('is an object of every ref’s serializer’s fields, each accepting null', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              type: 'object',
              required: ['city', 'iban'],
              properties: { city: { type: ['string', 'null'] }, iban: { type: ['string', 'null'] } },
            },
            contactFieldsNullable,
          ],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends every flattened field', () => {
        const address = PetSerializer({
          species: 'cat',
          location: { city: 'Paris' },
          contact: { email: 'a@b.c', name: 'A' },
        }).render()
        const billing = PetSerializer({ species: 'cat', location: { iban: 'FR76' }, contact: null }).render()

        expect(address).toEqual({ species: 'cat', city: 'Paris', iban: null, email: 'a@b.c', name: 'A' })
        expect(billing).toEqual({ species: 'cat', iban: 'FR76', city: null, email: null, name: null })

        expectValidatedAndSerialized(PetSerializer, [address, billing])
      })
    })

    // A key two attributes render holds whichever value was rendered last:
    // Dream spreads a flattened value over the keys rendered before it, and
    // renders a later attribute over those. So the key belongs to the
    // declaration rendered last, and every earlier declaration leaves it out.
    context('whose nested serializer renders a field another attribute also renders', () => {
      interface Owner {
        id: string
        email: string
      }

      const OwnerSerializer = named(
        (data: Owner) =>
          ObjectSerializer(data)
            .attribute('id', { openapi: 'string' })
            .attribute('email', { openapi: 'string' }),
        'Owner',
      )
      const ownerRef = { $ref: '#/components/schemas/Owner' }

      interface Tag {
        id: string
        label: string
      }

      const TagSerializer = named(
        (data: Tag) =>
          ObjectSerializer(data)
            .attribute('id', { openapi: 'string' })
            .attribute('label', { openapi: 'string' }),
        'Tag',
      )

      context('an attribute of the serializer flattening it', () => {
        const PetSerializer = named(
          (data: { id: string; species: string; owner: Owner | null }) =>
            ObjectSerializer(data)
              .customAttribute('owner', () => (data.owner ? OwnerSerializer(data.owner).render() : null), {
                flatten: true,
                openapi: { $serializer: OwnerSerializer, maybeNull: true },
              })
              .attribute('id', { openapi: 'string' })
              .attribute('species', { openapi: 'string' }),
          'OwnedPet',
        )

        it('leaves that field to the attribute declared after it, whose schema describes it', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              {
                type: 'object',
                required: ['id', 'species'],
                properties: { id: { type: 'string' }, species: { type: 'string' } },
              },
              { type: 'object', required: ['email'], properties: { email: { type: ['string', 'null'] } } },
            ],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends the payloads Dream renders', () => {
          const presentOwner = PetSerializer({
            id: 'p1',
            species: 'cat',
            owner: { id: 'o1', email: 'a@b.c' },
          }).render()
          const nullOwner = PetSerializer({ id: 'p1', species: 'cat', owner: null }).render()

          expect(presentOwner).toEqual({ id: 'p1', species: 'cat', email: 'a@b.c' })
          expect(nullOwner).toEqual({ id: 'p1', species: 'cat', email: null })

          expectValidatedAndSerialized(PetSerializer, [presentOwner, nullOwner])
        })
      })

      context('another flattened attribute', () => {
        const PetSerializer = named(
          (data: { species: string; owner: Owner; tag: Tag | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .customAttribute('tag', () => (data.tag ? TagSerializer(data.tag).render() : null), {
                flatten: true,
                openapi: { $serializer: TagSerializer, maybeNull: true },
              })
              .rendersOne('owner', { serializer: OwnerSerializer, flatten: true }),
          'OwnedTaggedPet',
        )

        it('leaves that field to the flattened attribute declared after it, whose ref describes it', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              parentInline,
              { type: 'object', required: ['label'], properties: { label: { type: ['string', 'null'] } } },
              ownerRef,
            ],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends the payloads Dream renders', () => {
          const owner = { id: 'o1', email: 'a@b.c' }

          expectValidatedAndSerialized(PetSerializer, [
            PetSerializer({ species: 'cat', owner, tag: { id: 't1', label: 'L' } }).render(),
            PetSerializer({ species: 'cat', owner, tag: null }).render(),
          ])
        })
      })

      context('another flattened customAttribute, whose keys its openapi declares', () => {
        const PetSerializer = named(
          (data: { species: string; owner: Owner; tag: Tag | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .customAttribute('tag', () => (data.tag ? TagSerializer(data.tag).render() : null), {
                flatten: true,
                openapi: { $serializer: TagSerializer, maybeNull: true },
              })
              .customAttribute('owner', () => OwnerSerializer(data.owner).render(), {
                flatten: true,
                openapi: { $serializer: OwnerSerializer },
              }),
          'CustomOwnedTaggedPet',
        )

        it('leaves that field to the flattened attribute declared after it, whose ref describes it', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              parentInline,
              { type: 'object', required: ['label'], properties: { label: { type: ['string', 'null'] } } },
              ownerRef,
            ],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends the payloads Dream renders', () => {
          const owner = { id: 'o1', email: 'a@b.c' }

          expectValidatedAndSerialized(PetSerializer, [
            PetSerializer({ species: 'cat', owner, tag: { id: 't1', label: 'L' } }).render(),
            PetSerializer({ species: 'cat', owner, tag: null }).render(),
          ])
        })
      })

      context('declared after that attribute', () => {
        const PetSerializer = named(
          (data: { id: string; species: string; owner: Owner | null }) =>
            ObjectSerializer(data)
              .attribute('id', { openapi: 'string' })
              .attribute('species', { openapi: 'string' })
              .customAttribute('owner', () => (data.owner ? OwnerSerializer(data.owner).render() : null), {
                flatten: true,
                openapi: { $serializer: OwnerSerializer, maybeNull: true },
              }),
          'LateOwnedPet',
        )

        it('takes the field from the attribute, so its own schema describes it', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              { type: 'object', required: ['species'], properties: { species: { type: 'string' } } },
              {
                type: 'object',
                required: ['email', 'id'],
                properties: { email: { type: ['string', 'null'] }, id: { type: ['string', 'null'] } },
              },
            ],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends the payloads Dream renders, the field holding the flattened value’s', () => {
          const presentOwner = PetSerializer({
            id: 'p1',
            species: 'cat',
            owner: { id: 'o1', email: 'a@b.c' },
          }).render()
          const nullOwner = PetSerializer({ id: 'p1', species: 'cat', owner: null }).render()

          expect(presentOwner).toEqual({ id: 'o1', species: 'cat', email: 'a@b.c' })
          expect(nullOwner).toEqual({ id: null, species: 'cat', email: null })

          expectValidatedAndSerialized(PetSerializer, [presentOwner, nullOwner])
        })
      })

      context('declared after another flattened attribute', () => {
        const PetSerializer = named(
          (data: { species: string; owner: Owner; tag: Tag | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .rendersOne('owner', { serializer: OwnerSerializer, flatten: true })
              .customAttribute('tag', () => (data.tag ? TagSerializer(data.tag).render() : null), {
                flatten: true,
                openapi: { $serializer: TagSerializer, maybeNull: true },
              }),
          'LateTaggedOwnedPet',
        )

        it('takes the field from the earlier flattened attribute, whose ref becomes its other fields', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              parentInline,
              { type: 'object', required: ['email'], properties: { email: { type: 'string' } } },
              {
                type: 'object',
                required: ['id', 'label'],
                properties: { id: { type: ['string', 'null'] }, label: { type: ['string', 'null'] } },
              },
            ],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends the payloads Dream renders', () => {
          const owner = { id: 'o1', email: 'a@b.c' }
          const tagged = PetSerializer({ species: 'cat', owner, tag: { id: 't1', label: 'L' } }).render()
          const untagged = PetSerializer({ species: 'cat', owner, tag: null }).render()

          expect(tagged).toEqual({ species: 'cat', id: 't1', email: 'a@b.c', label: 'L' })
          expect(untagged).toEqual({ species: 'cat', id: null, email: 'a@b.c', label: null })

          expectValidatedAndSerialized(PetSerializer, [tagged, untagged])
        })
      })
    })

    // The document's components carry no property lock, flattened or not, so a
    // key a flattened serializer does not declare passes response validation,
    // as it does for a plain serializer. A lock on a flattened serializer's
    // component would reject every payload of a serializer flattening it: the
    // component's `unevaluatedProperties` sees only the properties evaluated
    // inside the component, not the flattening serializer's own.
    context('a serializer flattening one that flattens another', () => {
      interface Address {
        city: string
      }

      interface ContactWithAddress {
        email: string
        address: Address
      }

      const AddressSerializer = named(
        (data: Address) => ObjectSerializer(data).attribute('city', { openapi: 'string' }),
        'NestedAddress',
      )
      const ContactWithAddressSerializer = named(
        (data: ContactWithAddress) =>
          ObjectSerializer(data)
            .attribute('email', { openapi: 'string' })
            .rendersOne('address', { serializer: AddressSerializer, flatten: true }),
        'NestedContactWithAddress',
      )

      const contact: ContactWithAddress = { email: 'a@b.c', address: { city: 'Paris' } }
      const nestedPresentPayload = { species: 'cat', email: 'a@b.c', city: 'Paris' }

      // each payload passes response validation and is sent as is, and so does
      // the first one with a key no serializer declares
      function expectValidatedAgainstOpenComponents(serializer: Serializer, payloads: unknown[]) {
        expectValidatedAndSerialized(serializer, payloads)

        expect(JSON.stringify(documentComponents(serializer))).not.toMatch(
          /additionalProperties|unevaluatedProperties/,
        )
        expect(
          validateAgainstDocument({ ...(payloads[0] as object), bogus: 1 }, serializer).errors,
        ).toBeUndefined()
      }

      it('a plain serializer’s component also accepts a key the serializer does not declare', () => {
        expect(validateAgainstDocument({ city: 'Paris', bogus: 1 }, AddressSerializer).errors).toBeUndefined()
      })

      context('through a rendersOne', () => {
        const PetSerializer = named(
          (data: { species: string; contact: ContactWithAddress }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .rendersOne('contact', { serializer: ContactWithAddressSerializer, flatten: true }),
          'NestedFlattenPet',
        )

        it('validates the payload Dream renders against the document, and accepts an unknown key', () => {
          const present = PetSerializer({ species: 'cat', contact }).render()
          expect(present).toEqual(nestedPresentPayload)

          expectValidatedAgainstOpenComponents(PetSerializer, [present])
        })
      })

      context('through an optional rendersOne', () => {
        const PetSerializer = named(
          (data: { species: string; contact: ContactWithAddress | null }) =>
            ObjectSerializer(data).attribute('species', { openapi: 'string' }).rendersOne('contact', {
              serializer: ContactWithAddressSerializer,
              flatten: true,
              optional: true,
            }),
          'NestedFlattenOptionalPet',
        )

        it('validates the payloads Dream renders against the document, with the nested fields present or null, and accepts an unknown key', () => {
          const present = PetSerializer({ species: 'cat', contact }).render()
          const absent = PetSerializer({ species: 'cat', contact: null }).render()
          expect(present).toEqual(nestedPresentPayload)
          expect(absent).toEqual({ species: 'cat', email: null, city: null })

          expectValidatedAgainstOpenComponents(PetSerializer, [present, absent])
        })
      })

      context('through a customAttribute whose openapi is a $serializer', () => {
        const PetSerializer = named(
          (data: { species: string; contact: ContactWithAddress }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .customAttribute('contact', () => ContactWithAddressSerializer(data.contact).render(), {
                flatten: true,
                openapi: { $serializer: ContactWithAddressSerializer },
              }),
          'NestedFlattenCustomAttributePet',
        )

        it('validates the payload Dream renders against the document, and accepts an unknown key', () => {
          const present = PetSerializer({ species: 'cat', contact }).render()
          expect(present).toEqual(nestedPresentPayload)

          expectValidatedAgainstOpenComponents(PetSerializer, [present])
        })
      })

      context('through a customAttribute whose openapi is a maybeNull $serializer', () => {
        const PetSerializer = named(
          (data: { species: string; contact: ContactWithAddress | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .customAttribute(
                'contact',
                () => (data.contact ? ContactWithAddressSerializer(data.contact).render() : null),
                { flatten: true, openapi: { $serializer: ContactWithAddressSerializer, maybeNull: true } },
              ),
          'NestedFlattenMaybeNullCustomAttributePet',
        )

        it('validates the payloads Dream renders against the document, with the nested fields present or null, and accepts an unknown key', () => {
          const present = PetSerializer({ species: 'cat', contact }).render()
          const absent = PetSerializer({ species: 'cat', contact: null }).render()
          expect(present).toEqual(nestedPresentPayload)
          expect(absent).toEqual({ species: 'cat', email: null, city: null })

          expectValidatedAgainstOpenComponents(PetSerializer, [present, absent])
        })
      })
    })
  })
})

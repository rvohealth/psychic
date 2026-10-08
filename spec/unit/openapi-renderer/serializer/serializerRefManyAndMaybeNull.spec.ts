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
import SerializerOpenapiRenderer from '../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
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
  const stringify = fastJsonStringify(documentSchema(serializer), { ajv: { validateFormats: false } })
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

    // each ref is in an `allOf`, which fast-json-stringify merges without losing
    // a sibling's fields (see `mergeableRef` in SerializerOpenapiRenderer)
    const contactRef = { allOf: [{ $ref: '#/components/schemas/Contact' }] }
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

    // each payload passes response validation and is sent as is by an endpoint with `fastJsonStringify: true`
    function expectValidatedAndSerialized(serializer: Serializer, payloads: unknown[]) {
      for (const payload of payloads) {
        expect(validateAgainstRenderedSchema(payload, serializer).errors).toBeUndefined()
        expect(validateAgainstDocument(payload, serializer).errors).toBeUndefined()
        expect(stringifyAgainstDocument(payload, serializer)).toEqual(payload)
      }
    }

    function expectFlattenedNullableValidation(serializer: Serializer) {
      expectValidatedAndSerialized(serializer, [presentPayload, fieldsOmittedPayload, fieldsNullPayload])

      expect(validateAgainstRenderedSchema(partialPayload, serializer).isValid).toBe(false)
      expect(validateAgainstRenderedSchema(unknownKeyPayload, serializer).isValid).toBe(false)
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
                { allOf: [{ $ref: '#/components/schemas/BalloonLatex' }] },
                { allOf: [{ $ref: '#/components/schemas/BalloonMylar' }] },
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
              { allOf: [{ $ref: '#/components/schemas/ContactWithAddress' }] },
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
              { allOf: [{ $ref: '#/components/schemas/PersonName' }] },
              { type: 'object', properties: { first_name: { type: 'null' } } },
            ],
          },
        ],
        unevaluatedProperties: false,
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
      const stiRefs = {
        anyOf: [
          { allOf: [{ $ref: '#/components/schemas/BalloonLatex' }] },
          { allOf: [{ $ref: '#/components/schemas/BalloonMylar' }] },
        ],
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

        it('is any of the child serializers', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [parentInline, stiRefs, { anyOf: [contactRef, contactFieldsNull] }],
            unevaluatedProperties: false,
          })
        })

        it('validates and sends every flattened field', async () => {
          const { latex, mylar } = await balloons()
          const contact = { email: 'a@b.c', name: 'A' }

          expect(PetSerializer({ species: 'cat', balloon: latex, contact }).render()).toEqual({
            species: 'cat',
            ...LatexSerializer(latex, {}).render(),
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

        it('is any of the child serializers', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [parentInline, stiRefs, { anyOf: [contactRef, contactFieldsNull] }],
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

      it('is any of the refs', () => {
        expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
          type: 'object',
          allOf: [
            parentInline,
            {
              anyOf: [
                { allOf: [{ $ref: '#/components/schemas/Address' }] },
                { allOf: [{ $ref: '#/components/schemas/Billing' }] },
              ],
            },
            { anyOf: [contactRef, contactFieldsNull] },
          ],
          unevaluatedProperties: false,
        })
      })

      it('validates and sends every flattened field', () => {
        expectValidatedAndSerialized(PetSerializer, [
          PetSerializer({
            species: 'cat',
            location: { city: 'Paris' },
            contact: { email: 'a@b.c', name: 'A' },
          }).render(),
          PetSerializer({ species: 'cat', location: { iban: 'FR76' }, contact: null }).render(),
        ])
      })
    })

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
      const ownerRef = { allOf: [{ $ref: '#/components/schemas/Owner' }] }

      context('an attribute of the serializer flattening it', () => {
        const PetSerializer = named(
          (data: { id: string; species: string; owner: Owner | null }) =>
            ObjectSerializer(data)
              .attribute('id', { openapi: 'string' })
              .attribute('species', { openapi: 'string' })
              .customAttribute('owner', () => (data.owner ? OwnerSerializer(data.owner).render() : null), {
                flatten: true,
                openapi: { $serializer: OwnerSerializer, maybeNull: true },
              }),
          'OwnedPet',
        )

        it('leaves that field out of the null branch, so the attribute’s schema describes it', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              {
                type: 'object',
                required: ['id', 'species'],
                properties: { id: { type: 'string' }, species: { type: 'string' } },
              },
              { anyOf: [ownerRef, { type: 'object', properties: { email: { type: 'null' } } }] },
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

          expect(presentOwner).toEqual({ id: 'o1', species: 'cat', email: 'a@b.c' })
          expect(nullOwner).toEqual({ id: 'p1', species: 'cat' })

          expectValidatedAndSerialized(PetSerializer, [presentOwner, nullOwner])
        })
      })

      context('another flattened attribute', () => {
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

        const PetSerializer = named(
          (data: { species: string; owner: Owner; tag: Tag | null }) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: 'string' })
              .rendersOne('owner', { serializer: OwnerSerializer, flatten: true })
              .customAttribute('tag', () => (data.tag ? TagSerializer(data.tag).render() : null), {
                flatten: true,
                openapi: { $serializer: TagSerializer, maybeNull: true },
              }),
          'OwnedTaggedPet',
        )

        it('leaves that field out of the null branch, so the other attribute’s schema describes it', () => {
          expect(new SerializerOpenapiRenderer(PetSerializer).renderedOpenapi().openapi).toEqual({
            type: 'object',
            allOf: [
              parentInline,
              { $ref: '#/components/schemas/Owner' },
              {
                anyOf: [
                  { allOf: [{ $ref: '#/components/schemas/Tag' }] },
                  { type: 'object', properties: { label: { type: 'null' } } },
                ],
              },
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

        it('validates the payloads Dream renders against the document, with the nested fields present or omitted, and accepts an unknown key', () => {
          const present = PetSerializer({ species: 'cat', contact }).render()
          const absent = PetSerializer({ species: 'cat', contact: null }).render()
          expect(present).toEqual(nestedPresentPayload)
          expect(absent).toEqual({ species: 'cat' })

          expectValidatedAgainstOpenComponents(PetSerializer, [present, absent])
        })
      })
    })
  })
})

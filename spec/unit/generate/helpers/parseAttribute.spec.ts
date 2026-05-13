import parseAttribute from '../../../../src/generate/helpers/parseAttribute.js'

describe('parseAttribute (psychic)', () => {
  context('scalar columns', () => {
    it('camelizes the attribute name', () => {
      expect(parseAttribute('phone_number:string')).toEqual({
        attributeName: 'phoneNumber',
        attributeType: 'string',
        isArray: false,
        enumValues: undefined,
      })
    })

    it('detects arrays', () => {
      expect(parseAttribute('tags:string[]')).toMatchObject({
        attributeName: 'tags',
        attributeType: 'string',
        isArray: true,
      })
    })

    it('coerces uuid-suffix names to uuid type', () => {
      expect(parseAttribute('some_uuid:string')).toMatchObject({
        attributeType: 'uuid',
      })
    })
  })

  context('filtered columns', () => {
    it('returns null for _type columns', () => {
      expect(parseAttribute('owner_type:string')).toBeNull()
    })

    it('returns null for _id columns', () => {
      expect(parseAttribute('owner_id:string')).toBeNull()
    })

    it('returns null for deletedAt', () => {
      expect(parseAttribute('deleted_at:datetime')).toBeNull()
    })
  })

  context('belongs_to (legacy form)', () => {
    it('derives attribute name from model last segment', () => {
      expect(parseAttribute('User:belongs_to')).toEqual({
        attributeName: 'user',
        attributeType: 'belongs_to',
        isArray: false,
        enumValues: undefined,
      })
    })

    it('handles namespaced models', () => {
      expect(parseAttribute('Music/Score:belongs_to')).toMatchObject({
        attributeName: 'score',
        attributeType: 'belongs_to',
      })
    })

    it('handles trailing optional', () => {
      expect(parseAttribute('User:belongs_to:optional')).toMatchObject({
        attributeName: 'user',
        attributeType: 'belongs_to',
      })
    })
  })

  context('belongs_to with @alias (new form)', () => {
    it('uses the camelized alias as the attribute name', () => {
      expect(parseAttribute('InternalUser@cancelled_by:belongs_to')).toEqual({
        attributeName: 'cancelledBy',
        attributeType: 'belongs_to',
        isArray: false,
        enumValues: undefined,
      })
    })

    it('handles namespaced model with alias', () => {
      expect(parseAttribute('Messaging/Message@last_inbound_message:belongs_to:optional')).toMatchObject({
        attributeName: 'lastInboundMessage',
        attributeType: 'belongs_to',
      })
    })

    it('returns null for empty alias after @', () => {
      expect(parseAttribute('Model@:belongs_to')).toBeNull()
    })

    it('returns null for empty model before @', () => {
      expect(parseAttribute('@alias:belongs_to')).toBeNull()
    })
  })

  context('enum forms', () => {
    it('extracts enum values for declare-with-values form', () => {
      expect(parseAttribute('style:enum:place_styles:fancy,casual')).toMatchObject({
        attributeName: 'style',
        attributeType: 'enum',
        enumValues: 'fancy,casual',
      })
    })

    it('leaves enumValues undefined for reuse form', () => {
      expect(parseAttribute('style:enum:place_styles_enum')).toMatchObject({
        attributeName: 'style',
        attributeType: 'enum',
        enumValues: undefined,
      })
    })

    it('does not treat optional as enum values', () => {
      expect(parseAttribute('style:enum:place_styles:fancy,casual:optional')).toMatchObject({
        enumValues: 'fancy,casual',
      })
    })
  })

  context('malformed tokens', () => {
    it('returns null when name is missing', () => {
      expect(parseAttribute(':string')).toBeNull()
    })

    it('returns null when type is missing', () => {
      expect(parseAttribute('email')).toBeNull()
    })
  })
})

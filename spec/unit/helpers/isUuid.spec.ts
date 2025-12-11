import isUuid from '../../../src/helpers/isUuid.js'

describe('isUuid', () => {
  context('UUID versions', () => {
    it('accepts UUIDv1', () => {
      expect(isUuid('883b3fc3-70a8-101c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts UUIDv2', () => {
      expect(isUuid('883b3fc3-70a8-201c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts UUIDv3', () => {
      expect(isUuid('883b3fc3-70a8-301c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts UUIDv4', () => {
      expect(isUuid('883b3fc3-70a8-401c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts UUIDv5', () => {
      expect(isUuid('883b3fc3-70a8-501c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts UUIDv6', () => {
      expect(isUuid('883b3fc3-70a8-601c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts UUIDv7', () => {
      expect(isUuid('019b0b19-6fd1-706b-a0c1-58768dee1317')).toBe(true)
    })

    it('accepts UUIDv8', () => {
      expect(isUuid('883b3fc3-70a8-801c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts version 0', () => {
      expect(isUuid('883b3fc3-70a8-001c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts version 9', () => {
      expect(isUuid('883b3fc3-70a8-901c-a04a-a14b196ef832')).toBe(true)
    })

    it('accepts version a-f', () => {
      expect(isUuid('883b3fc3-70a8-a01c-a04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-b01c-a04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-c01c-a04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-d01c-a04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-e01c-a04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-f01c-a04a-a14b196ef832')).toBe(true)
    })
  })

  context('UUID variants', () => {
    it('accepts RFC 4122 variant (8, 9, a, b)', () => {
      expect(isUuid('883b3fc3-70a8-401c-804a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-401c-904a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-401c-a04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-401c-b04a-a14b196ef832')).toBe(true)
    })

    it('accepts Microsoft GUID variant (c, d)', () => {
      expect(isUuid('883b3fc3-70a8-401c-c04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-401c-d04a-a14b196ef832')).toBe(true)
    })

    it('accepts reserved variant (e, f)', () => {
      expect(isUuid('883b3fc3-70a8-401c-e04a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-401c-f04a-a14b196ef832')).toBe(true)
    })

    it('accepts NCS backward compatibility variant (0-7)', () => {
      expect(isUuid('883b3fc3-70a8-401c-004a-a14b196ef832')).toBe(true)
      expect(isUuid('883b3fc3-70a8-401c-704a-a14b196ef832')).toBe(true)
    })
  })

  context('case sensitivity', () => {
    it('accepts uppercase UUIDs', () => {
      expect(isUuid('883B3FC3-70A8-401C-A04A-A14B196EF832')).toBe(true)
    })

    it('accepts mixed case UUIDs', () => {
      expect(isUuid('883b3Fc3-70A8-401c-A04a-a14B196Ef832')).toBe(true)
    })
  })

  context('invalid formats', () => {
    it('rejects non-UUID strings', () => {
      expect(isUuid('hello')).toBe(false)
      expect(isUuid('not-a-uuid')).toBe(false)
      expect(isUuid('12345')).toBe(false)
    })

    it('rejects strings with wrong length', () => {
      expect(isUuid('883b3fc3-70a8-401c-a04a-a14b196ef83')).toBe(false) // too short
      expect(isUuid('883b3fc3-70a8-401c-a04a-a14b196ef8321')).toBe(false) // too long
    })

    it('rejects strings with wrong format', () => {
      expect(isUuid('883b3fc370a8401ca04aa14b196ef832')).toBe(false) // no hyphens
      expect(isUuid('883b3fc3_70a8_401c_a04a_a14b196ef832')).toBe(false) // underscores
      expect(isUuid('883b3fc3-70a8-401c-a04a')).toBe(false) // missing segments
    })

    it('rejects strings with invalid characters', () => {
      expect(isUuid('883b3fc3-70a8-401c-a04a-a14b196ef83g')).toBe(false) // invalid hex
      expect(isUuid('883b3fc3-70a8-401c-a04a-a14b196ef83z')).toBe(false) // invalid hex
    })
  })

  context('non-string types', () => {
    it('rejects numbers', () => {
      expect(isUuid(7.7)).toBe(false)
      expect(isUuid(123)).toBe(false)
    })

    it('rejects undefined', () => {
      expect(isUuid(undefined)).toBe(false)
    })

    it('rejects null', () => {
      expect(isUuid(null)).toBe(false)
    })

    it('rejects objects', () => {
      expect(isUuid({})).toBe(false)
      expect(isUuid([])).toBe(false)
    })

    it('rejects booleans', () => {
      expect(isUuid(true)).toBe(false)
      expect(isUuid(false)).toBe(false)
    })
  })
})

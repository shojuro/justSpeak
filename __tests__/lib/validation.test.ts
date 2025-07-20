import {
  sanitize,
  validators,
  validate,
  ValidationError,
  messageValidation,
  userValidation,
  safeJsonParse,
} from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('Sanitization', () => {
    it('should remove HTML tags', () => {
      expect(sanitize.html('<p>Hello <script>alert("xss")</script>World</p>'))
        .toBe('Hello World')
    })

    it('should escape special characters', () => {
      expect(sanitize.escape('<div>"Hello" & \'World\'</div>'))
        .toBe('&lt;div&gt;&quot;Hello&quot; &amp; &#x27;World&#x27;&lt;&#x2F;div&gt;')
    })

    it('should normalize whitespace', () => {
      expect(sanitize.trim('  Hello   World  '))
        .toBe('Hello World')
    })

    it('should remove non-alphanumeric characters', () => {
      expect(sanitize.alphanumeric('Hello@World123!'))
        .toBe('HelloWorld123')
    })

    it('should normalize email', () => {
      expect(sanitize.email(' TEST@EXAMPLE.COM '))
        .toBe('test@example.com')
    })
  })

  describe('Validators', () => {
    it('should validate required fields', () => {
      expect(validators.required('hello')).toBe(true)
      expect(validators.required('')).toBe(false)
      expect(validators.required(null)).toBe(false)
      expect(validators.required(undefined)).toBe(false)
      expect(validators.required([])).toBe(false)
      expect(validators.required(['item'])).toBe(true)
    })

    it('should validate email', () => {
      expect(validators.email('test@example.com')).toBe(true)
      expect(validators.email('invalid-email')).toBe(false)
    })

    it('should validate string length', () => {
      const minValidator = validators.minLength(5)
      const maxValidator = validators.maxLength(10)
      
      expect(minValidator('hello')).toBe(true)
      expect(minValidator('hi')).toBe(false)
      expect(maxValidator('hello')).toBe(true)
      expect(maxValidator('hello world!')).toBe(false)
    })

    it('should validate strong passwords', () => {
      expect(validators.strongPassword('Test123!')).toBe(true)
      expect(validators.strongPassword('weak')).toBe(false)
      expect(validators.strongPassword('NoNumber!')).toBe(false)
      expect(validators.strongPassword('nouppercas3!')).toBe(false)
    })
  })

  describe('Schema Validation', () => {
    it('should validate data against schema', () => {
      const schema = {
        email: [
          { validator: validators.required, message: 'Email is required' },
          { validator: validators.email, message: 'Invalid email format' },
        ],
        password: [
          { validator: validators.required, message: 'Password is required' },
          { validator: validators.minLength(8), message: 'Password too short' },
        ],
      }

      expect(() => {
        validate({ email: 'test@example.com', password: 'password123' }, schema)
      }).not.toThrow()

      expect(() => {
        validate({ email: 'invalid', password: 'short' }, schema)
      }).toThrow(ValidationError)
    })
  })

  describe('Message Validation', () => {
    it('should validate chat messages', () => {
      expect(messageValidation.validateChatMessage('Hello World'))
        .toBe('Hello World')
      
      expect(messageValidation.validateChatMessage('<p>Hello</p>'))
        .toBe('Hello')
      
      expect(() => {
        messageValidation.validateChatMessage('')
      }).toThrow('Message cannot be empty')
      
      expect(() => {
        messageValidation.validateChatMessage('a'.repeat(1001))
      }).toThrow('Message must be less than 1000 characters')
    })

    it('should validate context array', () => {
      const validContext = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]
      
      expect(messageValidation.validateContext(validContext)).toEqual(validContext)
      
      expect(() => {
        messageValidation.validateContext('not an array' as any)
      }).toThrow('Context must be an array')
      
      expect(() => {
        messageValidation.validateContext(new Array(11).fill({}))
      }).toThrow('Context cannot exceed 10 messages')
    })
  })

  describe('User Validation', () => {
    it('should validate email addresses', () => {
      expect(userValidation.validateEmail(' TEST@EXAMPLE.COM '))
        .toBe('test@example.com')
      
      expect(() => {
        userValidation.validateEmail('invalid-email')
      }).toThrow('Invalid email format')
    })

    it('should validate passwords', () => {
      expect(() => {
        userValidation.validatePassword('Test123!')
      }).not.toThrow()
      
      expect(() => {
        userValidation.validatePassword('short')
      }).toThrow('Password must be at least 8 characters long')
      
      expect(() => {
        userValidation.validatePassword('weakpassword')
      }).toThrow(/must contain at least one uppercase/)
    })

    it('should validate age groups', () => {
      expect(userValidation.validateAge('adult')).toBe('adult')
      
      expect(() => {
        userValidation.validateAge('invalid')
      }).toThrow('Invalid age group')
    })
  })

  describe('Safe JSON Parsing', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key": "value"}')).toEqual({ key: 'value' })
    })

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', {})).toEqual({})
      expect(safeJsonParse('invalid')).toBeUndefined()
    })
  })
})
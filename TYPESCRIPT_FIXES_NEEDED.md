# TypeScript Strict Mode Fixes Guide

With TypeScript strict mode enabled, you'll likely encounter several types of errors. Here's a guide to fix them:

## Common TypeScript Errors and Fixes

### 1. "Object is possibly 'null' or 'undefined'"
**Example Error:**
```typescript
const user = await getAuthenticatedUser()
user.id // Error: Object is possibly 'null'
```

**Fix:**
```typescript
const user = await getAuthenticatedUser()
if (!user) {
  // Handle null case
  return
}
user.id // Now TypeScript knows user is not null
```

### 2. "Parameter implicitly has an 'any' type"
**Example Error:**
```typescript
function handleError(error) { // Error: Parameter 'error' implicitly has an 'any' type
  console.log(error)
}
```

**Fix:**
```typescript
function handleError(error: Error | unknown) {
  if (error instanceof Error) {
    console.log(error.message)
  } else {
    console.log('Unknown error:', error)
  }
}
```

### 3. "Property does not exist on type"
**Example Error:**
```typescript
const response = await fetch(url)
const data = await response.json()
console.log(data.result) // Error: Property 'result' does not exist on type 'any'
```

**Fix:**
```typescript
interface ApiResponse {
  result: string
  // other properties
}

const response = await fetch(url)
const data: ApiResponse = await response.json()
console.log(data.result) // Now TypeScript knows the shape
```

### 4. "Argument of type 'X' is not assignable to parameter of type 'Y'"
**Common with event handlers:**
```typescript
// Error: Type 'string | undefined' is not assignable to type 'string'
setValue(event.target.value)
```

**Fix:**
```typescript
setValue(event.target.value || '')
// or
if (event.target.value !== undefined) {
  setValue(event.target.value)
}
```

### 5. "Cannot find name" (for browser APIs)
**Example:**
```typescript
const recognition = new webkitSpeechRecognition() // Error: Cannot find name 'webkitSpeechRecognition'
```

**Fix:**
Add type declarations:
```typescript
declare global {
  interface Window {
    webkitSpeechRecognition: any
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
```

## Quick Fixes for Common Patterns

### useRef with null
```typescript
// Before
const ref = useRef(null)

// After
const ref = useRef<HTMLDivElement>(null)
// or
const ref = useRef<SomeType | null>(null)
```

### useState with undefined
```typescript
// Before
const [value, setValue] = useState()

// After
const [value, setValue] = useState<string | undefined>()
// or initialize with a default
const [value, setValue] = useState('')
```

### Async functions
```typescript
// Before
async function fetchData() {
  // ...
}

// After - be explicit about return type
async function fetchData(): Promise<DataType | null> {
  // ...
}
```

### Event handlers
```typescript
// Before
const handleClick = (e) => {
  // ...
}

// After
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
}
```

## Running TypeScript Check

Once npm install completes, run:
```bash
npm run typecheck
```

This will show all TypeScript errors that need to be fixed.

## Tips for Fixing

1. **Fix one file at a time** - Start with the most critical files
2. **Use type assertions sparingly** - Only when you're certain about the type
3. **Create interfaces** - For API responses and complex objects
4. **Leverage TypeScript inference** - Let TypeScript infer types where possible
5. **Don't use 'any'** - Use 'unknown' if you truly don't know the type

## Priority Files to Fix

1. Authentication related files (lib/auth-helpers.ts)
2. API routes (app/api/*)
3. Core hooks (hooks/*)
4. Main components (components/conversation/*)

---

*Remember: The goal is type safety, not just making errors go away. Take time to add proper types.*
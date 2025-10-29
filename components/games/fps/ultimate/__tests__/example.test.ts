/**
 * Example Test Suite
 * 
 * @description Example tests to demonstrate testing patterns
 * @author Glxy97 + Claude Sonnet 4.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals'

// ============================================================================
// EXAMPLE: SIMPLE UNIT TEST
// ============================================================================

describe('Example Unit Test', () => {
  it('should demonstrate a passing test', () => {
    expect(true).toBe(true)
  })
  
  it('should demonstrate type checking', () => {
    const value: number = 42
    expect(typeof value).toBe('number')
    expect(value).toBe(42)
  })
  
  it('should demonstrate object testing', () => {
    const obj = { name: 'Test', value: 123 }
    
    expect(obj).toHaveProperty('name')
    expect(obj).toHaveProperty('value')
    expect(obj.name).toBe('Test')
    expect(obj.value).toBe(123)
  })
})

// ============================================================================
// EXAMPLE: TEST WITH SETUP/TEARDOWN
// ============================================================================

describe('Example with Setup', () => {
  let testValue: number
  
  beforeEach(() => {
    // Setup before each test
    testValue = 0
  })
  
  it('should increment value', () => {
    testValue++
    expect(testValue).toBe(1)
  })
  
  it('should start with clean state', () => {
    // Thanks to beforeEach, testValue is 0 again
    expect(testValue).toBe(0)
  })
})

// ============================================================================
// EXAMPLE: TESTING CLASSES
// ============================================================================

class Counter {
  private count = 0
  
  increment(): void {
    this.count++
  }
  
  decrement(): void {
    this.count--
  }
  
  getCount(): number {
    return this.count
  }
  
  reset(): void {
    this.count = 0
  }
}

describe('Counter Class', () => {
  let counter: Counter
  
  beforeEach(() => {
    counter = new Counter()
  })
  
  it('should start at 0', () => {
    expect(counter.getCount()).toBe(0)
  })
  
  it('should increment', () => {
    counter.increment()
    expect(counter.getCount()).toBe(1)
    
    counter.increment()
    expect(counter.getCount()).toBe(2)
  })
  
  it('should decrement', () => {
    counter.increment()
    counter.increment()
    counter.decrement()
    
    expect(counter.getCount()).toBe(1)
  })
  
  it('should reset', () => {
    counter.increment()
    counter.increment()
    counter.reset()
    
    expect(counter.getCount()).toBe(0)
  })
})

// ============================================================================
// EXAMPLE: TESTING ASYNC CODE
// ============================================================================

const fetchData = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('data')
    }, 100)
  })
}

describe('Async Tests', () => {
  it('should handle promises', async () => {
    const data = await fetchData()
    expect(data).toBe('data')
  })
  
  it('should handle promise rejection', async () => {
    const failingFunction = async () => {
      throw new Error('Failed!')
    }
    
    await expect(failingFunction()).rejects.toThrow('Failed!')
  })
})

// ============================================================================
// EXAMPLE: TESTING ERROR HANDLING
// ============================================================================

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero')
  }
  return a / b
}

describe('Error Handling', () => {
  it('should divide normally', () => {
    expect(divide(10, 2)).toBe(5)
  })
  
  it('should throw on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero')
  })
  
  it('should throw Error instance', () => {
    expect(() => divide(10, 0)).toThrow(Error)
  })
})

// ============================================================================
// EXAMPLE: TESTING CALLBACKS
// ============================================================================

class EventEmitter {
  private listeners: Array<(data: any) => void> = []
  
  on(callback: (data: any) => void): void {
    this.listeners.push(callback)
  }
  
  emit(data: any): void {
    this.listeners.forEach(cb => cb(data))
  }
}

describe('Event Emitter', () => {
  let emitter: EventEmitter
  
  beforeEach(() => {
    emitter = new EventEmitter()
  })
  
  it('should call listener when event emitted', () => {
    const listener = jest.fn()
    emitter.on(listener)
    
    emitter.emit('test-data')
    
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('test-data')
  })
  
  it('should call multiple listeners', () => {
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    
    emitter.on(listener1)
    emitter.on(listener2)
    
    emitter.emit('data')
    
    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })
})

// ============================================================================
// EXAMPLE: SNAPSHOT TESTING
// ============================================================================

describe('Snapshot Testing', () => {
  it('should match snapshot', () => {
    const data = {
      id: 'test-123',
      name: 'Test Object',
      values: [1, 2, 3]
    }
    
    expect(data).toMatchSnapshot()
  })
})

// ============================================================================
// EXAMPLE: PARAMETERIZED TESTS
// ============================================================================

describe.each([
  [1, 1, 2],
  [2, 2, 4],
  [3, 3, 6],
])('add(%i, %i)', (a, b, expected) => {
  it(`returns ${expected}`, () => {
    expect(a + b).toBe(expected)
  })
})

// ============================================================================
// TEST COVERAGE NOTES
// ============================================================================

/*
 * To run tests:
 * - npm run test                 # Run all tests
 * - npm run test -- --watch      # Watch mode
 * - npm run test -- --coverage   # Coverage report
 * 
 * Coverage goals:
 * - Statements: 80%+
 * - Branches: 80%+
 * - Functions: 80%+
 * - Lines: 80%+
 * 
 * What to test:
 * - ✅ Public methods
 * - ✅ Edge cases
 * - ✅ Error conditions
 * - ✅ State changes
 * - ✅ Event emissions
 * 
 * What NOT to test:
 * - ❌ Private methods (test through public API)
 * - ❌ Third-party libraries
 * - ❌ Simple getters/setters
 * - ❌ Constants
 */


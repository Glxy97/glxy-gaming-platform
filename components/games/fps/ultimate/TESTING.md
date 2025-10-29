# 🧪 TESTING GUIDE

**Comprehensive guide to testing Ultimate FPS**

---

## 🎯 TESTING PHILOSOPHY

### **We Practice TDD (Test-Driven Development):**
1. Write test FIRST
2. Watch it FAIL
3. Write minimal code to PASS
4. REFACTOR
5. Repeat

### **Why TDD?**
- ✅ Forces you to think about API design
- ✅ Ensures code is testable
- ✅ Provides instant feedback
- ✅ Creates living documentation
- ✅ Prevents regression

---

## 📊 TEST PYRAMID

```
       /\
      /  \      E2E Tests (10%)
     /____\     - Complete user flows
    /      \    - Browser testing
   /________\   - Slowest, most expensive
  /          \
 /            \ Integration Tests (30%)
/______________\- Components together
               - API + UI
               - Faster than E2E
              /              \
             /                \
            /                  \ Unit Tests (60%)
           /____________________\- Functions, classes
                                - Fastest
                                - Most coverage
```

### **Distribution:**
- **60% Unit Tests** - Test individual functions/methods
- **30% Integration Tests** - Test components working together
- **10% E2E Tests** - Test complete user flows

---

## 🛠️ SETUP

### **Test Environment:**
```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### **Configuration:**
Tests are configured in:
- `jest.config.js` - Jest configuration
- `__tests__/setup.ts` - Global setup & mocks

---

## 📝 WRITING TESTS

### **1. Unit Tests**

**Test individual functions/methods:**

```typescript
// components/games/fps/ultimate/utils/MathUtils.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// components/games/fps/ultimate/__tests__/unit/MathUtils.test.ts
import { clamp } from '../../utils/MathUtils'

describe('MathUtils', () => {
  describe('clamp', () => {
    it('should clamp value to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })
    
    it('should clamp value to max', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })
    
    it('should not clamp value in range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })
  })
})
```

### **2. Integration Tests**

**Test components working together:**

```typescript
// __tests__/integration/GameModes.test.ts
import { GameModeManager } from '../../core/GameModeManager'
import { UltimateFPSEngineV2 } from '../../core/UltimateFPSEngineV2'

describe('Game Modes Integration', () => {
  it('should change mode and update engine', () => {
    const container = createMockContainer()
    const engine = new UltimateFPSEngineV2(container)
    const manager = engine.gameModeManager
    
    // Change mode
    manager.changeMode('team-deathmatch')
    
    // Verify engine reacted
    expect(manager.currentMode).toBe('team-deathmatch')
    expect(engine.teamsEnabled).toBe(true)
  })
})
```

### **3. E2E Tests**

**Test complete user flows:**

```typescript
// __tests__/e2e/CompleteGame.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import UltimateFPSGame from '../../UltimateFPSGame'

describe('Complete Game Flow', () => {
  it('should play a complete round', async () => {
    render(<UltimateFPSGame />)
    
    // Start game
    fireEvent.click(screen.getByText('Start Game'))
    
    // Wait for game to load
    await screen.findByText('Round 1')
    
    // Play (simulate inputs)
    // ...
    
    // Verify round complete
    expect(screen.getByText('Round Complete')).toBeInTheDocument()
  })
})
```

---

## 🎭 MOCKING

### **Mock Three.js:**
```typescript
// Already done in __tests__/setup.ts
// Three.js is automatically mocked for all tests
```

### **Mock Custom Modules:**
```typescript
jest.mock('../../utils/AudioManager', () => ({
  AudioManager: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    stop: jest.fn()
  }))
}))
```

### **Mock Functions:**
```typescript
const mockCallback = jest.fn()

// Use it
someFunction(mockCallback)

// Verify
expect(mockCallback).toHaveBeenCalled()
expect(mockCallback).toHaveBeenCalledWith('expected-value')
expect(mockCallback).toHaveBeenCalledTimes(1)
```

### **Mock Timers:**
```typescript
jest.useFakeTimers()

// Code that uses setTimeout/setInterval
const callback = jest.fn()
setTimeout(callback, 1000)

// Fast-forward time
jest.advanceTimersByTime(1000)

expect(callback).toHaveBeenCalled()

jest.useRealTimers()
```

---

## 📋 TEST PATTERNS

### **AAA Pattern (Arrange, Act, Assert):**
```typescript
it('should increment counter', () => {
  // ARRANGE: Set up test data
  const counter = new Counter()
  
  // ACT: Perform action
  counter.increment()
  
  // ASSERT: Verify result
  expect(counter.getCount()).toBe(1)
})
```

### **Given-When-Then:**
```typescript
it('should reload weapon when out of ammo', () => {
  // GIVEN: A weapon with no ammo
  const weapon = new WeaponManager()
  weapon.currentWeapon.ammo = 0
  
  // WHEN: Reload is called
  weapon.reload()
  
  // THEN: Weapon should have full ammo
  expect(weapon.currentWeapon.ammo).toBe(30)
})
```

### **Test Each Scenario:**
```typescript
describe('shoot', () => {
  it('should shoot when has ammo', () => {
    // Test success case
  })
  
  it('should not shoot when no ammo', () => {
    // Test failure case
  })
  
  it('should not shoot when reloading', () => {
    // Test blocked case
  })
  
  it('should not shoot before fire rate cooldown', () => {
    // Test timing case
  })
})
```

---

## 🎯 COVERAGE GOALS

### **Target Coverage:**
- Statements: **80%+**
- Branches: **80%+**
- Functions: **80%+**
- Lines: **80%+**

### **View Coverage:**
```bash
npm run test:coverage
```

### **Coverage Report:**
```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   85.23 |    82.45 |   88.12 |   85.67 |
 GameModeManager  |   92.15 |    87.23 |   95.12 |   92.34 |
 WeaponManager    |   88.45 |    85.67 |   90.23 |   88.92 |
 Movement         |   78.23 |    75.12 |   82.45 |   78.67 |
------------------|---------|----------|---------|---------|
```

### **What to Test:**
- ✅ Public methods
- ✅ Edge cases
- ✅ Error conditions
- ✅ State changes
- ✅ Event emissions

### **What NOT to Test:**
- ❌ Private methods (test through public API)
- ❌ Third-party libraries
- ❌ Simple getters/setters (if no logic)
- ❌ Constants

---

## 🐛 DEBUGGING TESTS

### **Run Single Test:**
```bash
npm run test -- GameModeManager.test.ts
```

### **Run Tests Matching Pattern:**
```bash
npm run test -- --testNamePattern="should change mode"
```

### **Debug in VS Code:**
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### **Use `console.log` (temporarily!):**
```typescript
it('should do something', () => {
  const result = someFunction()
  console.log('Result:', result) // Debug output
  expect(result).toBe('expected')
})
```

### **Use `test.only` (temporarily!):**
```typescript
test.only('this one test', () => {
  // Only this test will run
})
```

---

## ✅ CHECKLIST

### **Before Committing:**
- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] No `test.only` or `test.skip`
- [ ] No `console.log` in tests
- [ ] Meaningful test names
- [ ] Tests are independent
- [ ] Tests are fast (<1s each)

### **Test Quality:**
- [ ] Tests one thing
- [ ] Clear assertion messages
- [ ] Uses AAA pattern
- [ ] Mocks external dependencies
- [ ] Cleans up after itself

---

## 🎓 BEST PRACTICES

### **1. Test Behavior, Not Implementation**
```typescript
// ❌ BAD: Testing implementation details
it('should call private method', () => {
  expect(object._privateMethod).toHaveBeenCalled()
})

// ✅ GOOD: Testing public behavior
it('should return correct result', () => {
  expect(object.publicMethod()).toBe('expected')
})
```

### **2. Keep Tests Independent**
```typescript
// ❌ BAD: Tests depend on each other
let counter = 0
it('test 1', () => { counter++ })
it('test 2', () => { expect(counter).toBe(1) }) // Breaks if test 1 doesn't run!

// ✅ GOOD: Tests are independent
beforeEach(() => { counter = 0 })
it('test 1', () => { counter++; expect(counter).toBe(1) })
it('test 2', () => { counter++; expect(counter).toBe(1) })
```

### **3. Use Descriptive Names**
```typescript
// ❌ BAD: Vague names
it('works', () => { ... })
it('test 1', () => { ... })

// ✅ GOOD: Descriptive names
it('should throw error when weapon ID is invalid', () => { ... })
it('should not allow negative health values', () => { ... })
```

### **4. One Assertion Per Test (Generally)**
```typescript
// ⚠️ OKAY: Multiple related assertions
it('should create player with correct defaults', () => {
  const player = new Player()
  expect(player.health).toBe(100)
  expect(player.armor).toBe(0)
  expect(player.isAlive).toBe(true)
})

// ❌ BAD: Unrelated assertions
it('should do everything', () => {
  // Tests 10 different things
})

// ✅ BETTER: Split into multiple tests
it('should start with 100 health', () => { ... })
it('should start with 0 armor', () => { ... })
it('should start alive', () => { ... })
```

---

## 📚 RESOURCES

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [TDD Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

**Happy Testing!** 🧪

**Remember:** Tests are not extra work, they ARE the work!


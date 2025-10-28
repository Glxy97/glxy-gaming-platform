# Next.js 15.5.3 Params-Verhalten

## TypeScript Build Error
```
Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally
```

## Ergebnis
Next.js 15.5.3 (und wahrscheinlich 15.5.x) erwartet **async params**:

### ✅ KORREKT für Next.js 15.5.3:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```

### ❌ FALSCH für Next.js 15.5.3:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params  // TypeScript Error!
  // ...
}
```

## Quelle
- Next.js 15.5.3 Build Output
- TypeScript Type Checking

## Note
Möglicherweise unterscheidet sich das Verhalten zwischen Next.js 15.0-15.4 und 15.5+.
Für 15.5.3 ist async params definitiv erforderlich.

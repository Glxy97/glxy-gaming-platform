# Next.js 15.5.3 Params Type Error

Error zeigt dass params ein Promise sein MUSS:
```
Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally
```

Das bedeutet Next.js 15.5.3 erwartet:
- params: Promise<{ id: string }>
- const { id } = await params

Nicht:
- params: { id: string }
- const { id } = params

Möglicherweise hat sich das in Next.js 15.5.x geändert.

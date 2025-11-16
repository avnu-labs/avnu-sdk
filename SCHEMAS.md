# Schema Validation Architecture

## Overview

This SDK uses **Zod** for runtime schema validation with TypeScript type safety. The schemas in `src/schemas.ts` are tightly coupled with the types in `src/types.ts` to ensure data integrity.

## Type-Safe Schema Pattern

We use the `satisfies` operator to create a bidirectional type check between Zod schemas and TypeScript types:

```typescript
export const QuoteSchema = z.object({
  quoteId: z.string(),
  sellAmount: hexToBigInt,
  buyAmount: hexToBigInt,
  // ... all other fields
}) satisfies z.ZodType<Quote>;
```

### What This Achieves

1. **Prevents Missing Fields**: If you forget a field in the schema, TypeScript will error
2. **Prevents Wrong Types**: If a field has the wrong type, TypeScript will error
3. **Prevents Extra Fields**: The schema must match the type exactly
4. **Single Source of Truth**: Types drive the schemas, not the other way around

### Example: Adding a New Field

**❌ Wrong - TypeScript will catch this:**
```typescript
// In types.ts: Add a new field
export interface Quote {
  quoteId: string;
  sellAmount: bigint;
  buyAmount: bigint;
  newField: string; // <- New field added
}

// In schemas.ts: Forget to add the field
export const QuoteSchema = z.object({
  quoteId: z.string(),
  sellAmount: hexToBigInt,
  buyAmount: hexToBigInt,
  // newField is missing! <- TypeScript ERROR
}) satisfies z.ZodType<Quote>;
// Error: Type 'ZodObject<...>' does not satisfy the constraint 'ZodType<Quote>'
```

**✅ Correct:**
```typescript
// Update both type AND schema
export const QuoteSchema = z.object({
  quoteId: z.string(),
  sellAmount: hexToBigInt,
  buyAmount: hexToBigInt,
  newField: z.string(), // <- Added!
}) satisfies z.ZodType<Quote>;
```

## Custom Transformers

### `hexToBigInt`
Transforms hex strings or numbers to `bigint`:
```typescript
// API returns: "0x1f399b1438a10000"
// Schema transforms to: 2250000000000000000n (bigint)
```

### `isoStringToDate`
Transforms ISO date strings to `Date` objects:
```typescript
// API returns: "2025-11-13T16:31:20Z"
// Schema transforms to: Date object
```

### `hexTimestampToDate`
Transforms hex timestamps (fields ending with `*Time`) to `Date`:
```typescript
// API returns: "0x691f8a41"
// Schema transforms to: Date object (from Unix timestamp)
```

### Important Note: Market Data Dates

**Market data schemas do NOT transform dates** - they keep them as strings:
```typescript
// In SimplePriceData, CandlePriceData, etc.
// API returns: "2025-11-13"
// Schema keeps as: string (NOT transformed to Date)
```

This is intentional because market data uses date strings for chart rendering, not Date objects.

## Migration from Zod v3 to v4

### Deprecated: `z.nativeEnum()`
Zod v4 deprecates `z.nativeEnum()` in favor of `z.enum()` which now accepts native enums directly.

**Before (Zod v3):**
```typescript
export const OrderStatusSchema = z.nativeEnum(OrderStatus);
```

**After (Zod v4):**
```typescript
export const OrderStatusSchema = z.enum(OrderStatus);
```

## Validated Schemas

The following main schemas have type validation enforced:

### Swap & DCA
- `QuoteSchema` → `Quote`
- `OrderReceiptSchema` → `OrderReceipt`
- `EstimatedGasFeesSchema` → `EstimatedGasFees`

### Staking
- `PoolMemberInfoSchema` → `PoolMemberInfo`
- `StakingInfoSchema` → `StakingInfo`

### Market Data
- `TokenMarketDataSchema` → `TokenMarketData`
- `SimplePriceDataSchema` → `SimplePriceData`
- `CandlePriceDataSchema` → `CandlePriceData`
- `SimpleVolumeDataSchema` → `SimpleVolumeData`
- `ByExchangeVolumeDataSchema` → `ByExchangeVolumeData`
- `ByExchangeTVLDataSchema` → `ByExchangeTVLData`

## Best Practices

1. **Always update both type and schema** when adding/removing/changing fields
2. **Run `yarn tsc --noEmit`** to catch schema/type mismatches early
3. **Use custom transformers** for consistent data transformation (BigInt, Date)
4. **Let TypeScript be your guide** - if the schema doesn't satisfy the type, there's a mismatch

## Testing

Run tests to ensure schemas correctly parse API responses:
```bash
yarn test
```

All schemas are tested against real API response fixtures in `src/*.spec.ts` files.

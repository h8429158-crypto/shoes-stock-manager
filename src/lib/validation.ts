import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: emailSchema,
  password: passwordSchema,
});

export const resetSchema = z.object({ email: emailSchema });

// ---------------------------------------------------------------------------
// Org
// ---------------------------------------------------------------------------

export const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
});

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{8}$/, 'Invite codes are 8 letters/numbers'),
});

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code (e.g. USD)'),
  taxRate: z.coerce
    .number({ message: 'Tax rate must be a number' })
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

const moneyInput = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[0-9]{1,7}([.,][0-9]{1,2})?$/.test(v.replace(/,/g, '')), {
    message: 'Enter a valid amount (e.g. 19.99)',
  });

const intInput = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d{1,7}$/.test(v), { message: `${label} must be a whole number` });

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().trim().min(1, 'SKU is required'),
  barcode: z.string().trim(),
  categoryId: z.string().nullable(),
  supplierId: z.string().nullable(),
  costPrice: moneyInput,
  sellingPrice: moneyInput,
  quantity: intInput('Quantity').refine((v) => v === '' || Number(v) >= 0, {
    message: 'Quantity cannot be negative',
  }),
  reorderLevel: intInput('Reorder level').refine((v) => v === '' || Number(v) >= 0, {
    message: 'Reorder level cannot be negative',
  }),
  unit: z.string().trim().min(1, 'Unit is required (e.g. pcs, pairs)'),
  notes: z.string(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name must be at least 2 characters'),
  contactName: z.string().trim(),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z.string().trim(),
  leadTimeDays: intInput('Lead time').refine((v) => v === '' || Number(v) >= 0, {
    message: 'Lead time cannot be negative',
  }),
  notes: z.string(),
});

// ---------------------------------------------------------------------------
// Stock ops / orders / invoices
// ---------------------------------------------------------------------------

export const stockOpSchema = z.object({
  quantity: z.coerce
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
  reason: z.enum(['purchase', 'sale', 'damage', 'return', 'adjustment']),
  note: z.string(),
});

export const poSchema = z.object({
  supplierId: z.string().min(1, 'Pick a supplier'),
  expectedDate: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: 'Use YYYY-MM-DD format',
    }),
  notes: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        unitCost: z.number().int().min(0),
      })
    )
    .min(1, 'Add at least one line item'),
});

export const invoiceSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required'),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().int().min(0),
      })
    )
    .min(1, 'Add at least one item'),
});

/** Flatten the first zod error message per field. */
export function zodErrors<T>(result: z.ZodSafeParseResult<T>): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

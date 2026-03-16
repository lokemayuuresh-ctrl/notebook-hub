// Runtime placeholders for TypeScript types to avoid import errors in JS runtime.
// These are empty objects used only so imports like `import { Product } from '@/types'` resolve at runtime.
// They do NOT provide type checking — keep the original `src/types/index.ts` if you need TypeScript.

export const Product = {};
export const CartItem = {};
export const User = {};
export const Order = {};

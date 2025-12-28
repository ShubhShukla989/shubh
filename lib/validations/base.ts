import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().url('Invalid URL format').optional().or(z.literal(''));
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number');

// File validation
export const imageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image format'),
});

// Common field validations
export const requiredString = (message = 'This field is required') => 
  z.string().min(1, message);

export const optionalString = z.string().optional();

export const positiveNumber = z.number().positive('Must be a positive number');
export const nonNegativeNumber = z.number().min(0, 'Must be non-negative');

// Alias validation (URL-friendly strings)
export const aliasSchema = z.string()
  .min(1, 'Alias is required')
  .regex(/^[a-z0-9-]+$/, 'Alias can only contain lowercase letters, numbers, and hyphens')
  .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Alias cannot start or end with hyphens');

// Date validation
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

// Boolean with default
export const booleanWithDefault = (defaultValue: boolean) => z.boolean().default(defaultValue);
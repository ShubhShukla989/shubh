import { z } from 'zod';
import { requiredString, optionalString, urlSchema, dateSchema, booleanWithDefault, positiveNumber } from './base';

export const editionSchema = z.object({
  title: requiredString('Edition title is required'),
  description: optionalString,
  date: dateSchema,
  category_id: positiveNumber,
  is_published: booleanWithDefault(false),
  pdf_url: urlSchema,
  cover_image_url: urlSchema,
});

export const editionUpdateSchema = editionSchema.partial().extend({
  id: positiveNumber,
});

// Page schema for editions
export const pageSchema = z.object({
  edition_id: positiveNumber,
  page_number: z.number().min(1, 'Page number must be at least 1'),
  image_url: requiredString('Page image is required'),
  title: optionalString,
  description: optionalString,
});

export const pageUpdateSchema = pageSchema.partial().extend({
  id: positiveNumber,
});

// Area map schema
export const areaMapSchema = z.object({
  page_id: positiveNumber,
  x: z.number().min(0, 'X coordinate must be non-negative').max(100, 'X coordinate must be ≤ 100'),
  y: z.number().min(0, 'Y coordinate must be non-negative').max(100, 'Y coordinate must be ≤ 100'),
  width: z.number().min(1, 'Width must be at least 1').max(100, 'Width must be ≤ 100'),
  height: z.number().min(1, 'Height must be at least 1').max(100, 'Height must be ≤ 100'),
  title: requiredString('Area title is required'),
  description: optionalString,
  link_url: urlSchema,
  category_id: positiveNumber.optional(),
});

export const areaMapUpdateSchema = areaMapSchema.partial().extend({
  id: positiveNumber,
});

// Type exports
export type EditionFormData = z.infer<typeof editionSchema>;
export type EditionUpdateData = z.infer<typeof editionUpdateSchema>;
export type PageFormData = z.infer<typeof pageSchema>;
export type PageUpdateData = z.infer<typeof pageUpdateSchema>;
export type AreaMapFormData = z.infer<typeof areaMapSchema>;
export type AreaMapUpdateData = z.infer<typeof areaMapUpdateSchema>;
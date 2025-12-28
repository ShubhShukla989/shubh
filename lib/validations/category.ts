import { z } from 'zod';
import { requiredString, optionalString, urlSchema, aliasSchema, booleanWithDefault, nonNegativeNumber, positiveNumber } from './base';

export const categorySchema = z.object({
  title: requiredString('Category title is required'),
  alias: aliasSchema,
  description: optionalString,
  parent_id: positiveNumber.optional(),
  image_url: urlSchema,
  meta_title: optionalString,
  meta_description: optionalString,
  meta_keywords: optionalString,
  robots: z.enum(['index, follow', 'noindex, nofollow', 'index, nofollow', 'noindex, follow']).default('index, follow'),
  is_active: booleanWithDefault(true),
  is_featured: booleanWithDefault(false),
  display_order: nonNegativeNumber.default(0),
});

export const categoryUpdateSchema = categorySchema.partial().extend({
  id: positiveNumber,
});

// Watermark settings for categories
export const categoryWatermarkSchema = z.object({
  category_id: positiveNumber,
  enable_watermarking: booleanWithDefault(false),
  logo_url: urlSchema,
  opacity: z.number().min(0, 'Opacity must be at least 0').max(100, 'Opacity must be at most 100').default(50),
  mode: z.enum(['in_outerside', 'in_inside']).default('in_outerside'),
  position: z.enum(['top_left', 'top_center', 'top_right', 'bottom_left', 'bottom_center', 'bottom_right']).default('top_center'),
  min_width_px: z.number().min(1, 'Minimum width must be at least 1px').default(100),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#FFFFFF'),
  foreground_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#000000'),
  enable_border: booleanWithDefault(false),
  border_width: z.number().min(0, 'Border width must be non-negative').default(1),
  border_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#000000'),
  info_text: optionalString,
  info_text_font: z.enum(['English', 'Hindi', 'Gujarati']).default('English'),
  enable_center_watermark: booleanWithDefault(false),
  center_watermark_url: urlSchema,
  center_watermark_opacity: z.number().min(0, 'Opacity must be at least 0').max(100, 'Opacity must be at most 100').default(30),
});

// Type exports
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>;
export type CategoryWatermarkData = z.infer<typeof categoryWatermarkSchema>;
import { z } from 'zod';
import { requiredString, optionalString, urlSchema, aliasSchema, booleanWithDefault, positiveNumber } from './base';

export const pageContentSchema = z.object({
  title: requiredString('Page title is required'),
  alias: aliasSchema,
  description: optionalString,
  content: requiredString('Page content is required'),
  status: z.enum(['Public', 'Draft', 'Private']).default('Draft'),
  meta_title: optionalString,
  meta_description: optionalString,
  meta_keywords: optionalString,
  featured_image: urlSchema,
  is_featured: booleanWithDefault(false),
  display_order: z.number().min(0, 'Display order must be non-negative').default(0),
});

export const pageContentUpdateSchema = pageContentSchema.partial().extend({
  id: positiveNumber,
});

// SEO schema for pages
export const seoSchema = z.object({
  meta_title: z.string().max(60, 'Meta title should be under 60 characters').optional(),
  meta_description: z.string().max(160, 'Meta description should be under 160 characters').optional(),
  meta_keywords: z.string().max(255, 'Meta keywords should be under 255 characters').optional(),
  og_title: z.string().max(60, 'OG title should be under 60 characters').optional(),
  og_description: z.string().max(160, 'OG description should be under 160 characters').optional(),
  og_image: urlSchema,
  canonical_url: urlSchema,
  robots: z.enum(['index, follow', 'noindex, nofollow', 'index, nofollow', 'noindex, follow']).default('index, follow'),
});

// Menu item schema
export const menuItemSchema = z.object({
  menu_id: positiveNumber,
  title: requiredString('Menu item title is required'),
  url: z.string().min(1, 'URL is required'),
  target: z.enum(['_self', '_blank']).default('_self'),
  parent_id: positiveNumber.optional(),
  display_order: z.number().min(0, 'Display order must be non-negative').default(0),
  is_active: booleanWithDefault(true),
  css_class: optionalString,
  icon: optionalString,
});

export const menuItemUpdateSchema = menuItemSchema.partial().extend({
  id: positiveNumber,
});

// Type exports
export type PageContentFormData = z.infer<typeof pageContentSchema>;
export type PageContentUpdateData = z.infer<typeof pageContentUpdateSchema>;
export type SEOFormData = z.infer<typeof seoSchema>;
export type MenuItemFormData = z.infer<typeof menuItemSchema>;
export type MenuItemUpdateData = z.infer<typeof menuItemUpdateSchema>;
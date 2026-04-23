import { pgTable, serial, integer, text, real, boolean, index } from 'drizzle-orm/pg-core';

export const editions = pgTable('editions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  alias: text('alias'),
  date: text('date').notNull(),
  category_id: integer('category_id'),
  pdf_url: text('pdf_url'),
  description: text('description'),
  status: text('status').default('Draft'),
  created_by: integer('created_by'),
  updated_by: integer('updated_by'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  is_featured: boolean('is_featured').default(false),
  seo_h1: text('seo_h1'),
  seo_meta_description: text('seo_meta_description'),
  scheduled_date: text('scheduled_date'),
});

export const edition_pages = pgTable('edition_pages', {
  id: serial('id').primaryKey(),
  edition_id: integer('edition_id'),
  page_number: integer('page_number').notNull(),
  image_url: text('image_url').notNull(),
  thumb_url: text('thumb_url'),
  page_category_id: integer('page_category_id'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  title: text('title'),
  alias: text('alias'),
  description: text('description'),
  category: text('category'),
}, (table) => ({
  editionIdIdx: index('edition_pages_edition_id_idx').on(table.edition_id),
}));

export const area_maps = pgTable('area_maps', {
  id: serial('id').primaryKey(),
  page_id: integer('page_id').notNull(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  title: text('title'),
  url: text('url'),
  watermarked_image_url: text('watermarked_image_url'),
  watermark_version: text('watermark_version'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  linked_area_ids: text('linked_area_ids').default('{}'),
  linked_page_number: integer('linked_page_number'),
  edition_id: integer('edition_id'),
  group_id: text('group_id'),
  combined_image_url: text('combined_image_url'),
  content: text('content'),
}, (table) => ({
  editionIdIdx: index('area_maps_edition_id_idx').on(table.edition_id),
  pageIdIdx: index('area_maps_page_id_idx').on(table.page_id),
}));

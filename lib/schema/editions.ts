import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const editions = sqliteTable('editions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
  is_featured: integer('is_featured', { mode: 'boolean' }).default(false),
  seo_h1: text('seo_h1'),
  seo_meta_description: text('seo_meta_description'),
  scheduled_date: text('scheduled_date'),
});

export const edition_pages = sqliteTable('edition_pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
});

export const edition_page_areas = sqliteTable('edition_page_areas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  page_id: integer('page_id'),
  area_name: text('area_name').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  metadata: text('metadata').default('{}'), // jsonb stored as text
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const area_maps = sqliteTable('area_maps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  page_id: integer('page_id').notNull(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  title: text('title'),
  url: text('url'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  linked_area_ids: text('linked_area_ids').default('{}'), // array stored as text
  linked_page_number: integer('linked_page_number'),
  edition_id: integer('edition_id'),
});

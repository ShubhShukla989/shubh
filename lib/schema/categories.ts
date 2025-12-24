import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  alias: text('alias'),
  status: text('status').default('active'),
  parent_id: integer('parent_id'),
  sort_order: integer('sort_order').default(0),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const epaper_categories = sqliteTable('epaper_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  alias: text('alias').notNull().unique(),
  description: text('description'),
  parent_id: integer('parent_id'),
  image_url: text('image_url'),
  meta_title: text('meta_title'),
  meta_description: text('meta_description'),
  meta_keywords: text('meta_keywords'),
  robots: text('robots').default('index, follow'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  is_featured: integer('is_featured', { mode: 'boolean' }).default(false),
  display_order: integer('display_order').default(0),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  archive_layout: text('archive_layout'),
});

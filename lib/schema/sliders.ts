import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const sliders = sqliteTable('sliders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  alias: text('alias').notNull().unique(),
  description: text('description'),
  status: text('status').default('Active'),
  config: text('config').default('{}'), // jsonb stored as text
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const slides = sqliteTable('slides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slider_id: integer('slider_id').notNull(),
  image_url: text('image_url').notNull(),
  caption: text('caption'),
  alt: text('alt').default(''),
  link: text('link'),
  position: integer('position').default(0),
  visible: integer('visible', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

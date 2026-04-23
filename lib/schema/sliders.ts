import { pgTable, serial, integer, text, boolean } from 'drizzle-orm/pg-core';

export const sliders = pgTable('sliders', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  alias: text('alias').notNull().unique(),
  description: text('description'),
  status: text('status').default('Active'),
  config: text('config').default('{}'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const slides = pgTable('slides', {
  id: serial('id').primaryKey(),
  slider_id: integer('slider_id').notNull(),
  image_url: text('image_url').notNull(),
  caption: text('caption'),
  alt: text('alt').default(''),
  link: text('link'),
  position: integer('position').default(0),
  visible: boolean('visible').default(true),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

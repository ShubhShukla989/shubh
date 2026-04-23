import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  alias: text('alias').notNull().unique(),
  description: text('description'),
  content: text('content'),
  status: text('status').default('Public'),
  meta_title: text('meta_title'),
  meta_description: text('meta_description'),
  meta_keywords: text('meta_keywords'),
  og_image: text('og_image'),
  twitter_title: text('twitter_title'),
  twitter_description: text('twitter_description'),
  twitter_image: text('twitter_image'),
  header_code: text('header_code'),
  footer_code: text('footer_code'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const menus = pgTable('menus', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  items: text('items').default('[]'),
  status: text('status').default('Active'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  alias: text('alias').unique(),
});

export const menu_items = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  menu_id: integer('menu_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  url: text('url'),
  page_id: integer('page_id'),
  category_id: integer('category_id'),
  position: integer('position').default(0),
  parent_id: integer('parent_id'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const media_files = pgTable('media_files', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_url: text('file_url').notNull(),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),
  title: text('title'),
  alt_text: text('alt_text'),
  created_at: text('created_at').$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const media_tags = pgTable('media_tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  created_at: text('created_at').$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const media_file_tags = pgTable('media_file_tags', {
  id: serial('id').primaryKey(),
  media_file_id: integer('media_file_id'),
  media_tag_id: integer('media_tag_id'),
  created_at: text('created_at').$defaultFn(() => new Date().toISOString()),
});

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const media_files = sqliteTable('media_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_url: text('file_url').notNull(),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),
  title: text('title'),
  alt_text: text('alt_text'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const media_tags = sqliteTable('media_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const media_file_tags = sqliteTable('media_file_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  media_file_id: integer('media_file_id'),
  media_tag_id: integer('media_tag_id'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

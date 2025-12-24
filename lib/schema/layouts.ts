import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const layouts = sqliteTable('layouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  structure: text('structure').notNull().default('{"rows": []}'), // jsonb stored as text
  status: text('status').default('draft'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  custom_css: text('custom_css').default(''),
  custom_js: text('custom_js').default(''),
});

export const layout_backups = sqliteTable('layout_backups', {
  id: text('id').primaryKey(),
  layout_name: text('layout_name').notNull(),
  structure: text('structure').notNull(), // jsonb stored as text
  timestamp: text('timestamp').notNull().default('CURRENT_TIMESTAMP'),
});

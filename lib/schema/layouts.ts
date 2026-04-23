import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const layouts = pgTable('layouts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  structure: text('structure').notNull().default('{"rows": []}'),
  status: text('status').default('draft'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  custom_css: text('custom_css').default(''),
  custom_js: text('custom_js').default(''),
});

export const layout_backups = pgTable('layout_backups', {
  id: text('id').primaryKey(),
  layout_name: text('layout_name').notNull(),
  structure: text('structure').notNull(),
  timestamp: text('timestamp').notNull().default('CURRENT_TIMESTAMP'),
});

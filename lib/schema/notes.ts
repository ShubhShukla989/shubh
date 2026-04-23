import { pgTable, serial, integer, text, bigint } from 'drizzle-orm/pg-core';
import { users } from './users';

export const admin_notes = pgTable('admin_notes', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  created_by: integer('created_by').notNull().references(() => users.id),
  updated_by: integer('updated_by').references(() => users.id),
  created_at: bigint('created_at', { mode: 'number' }).notNull().$defaultFn(() => Date.now()),
  updated_at: bigint('updated_at', { mode: 'number' }).notNull().$defaultFn(() => Date.now()),
});

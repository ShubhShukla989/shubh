import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const epaper_clips = pgTable('epaper_clips', {
  id: serial('id').primaryKey(),
  image_url: text('image_url').notNull(),
  clip_url: text('clip_url').notNull(),
  edition_id: integer('edition_id').notNull(),
  page_number: integer('page_number').notNull(),
  created_at: text('created_at').notNull(),
});

export type Clip = typeof epaper_clips.$inferSelect;
export type NewClip = typeof epaper_clips.$inferInsert;

import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const page_views = pgTable('page_views', {
  id: serial('id').primaryKey(),
  page_url: text('page_url').notNull(),
  user_ip: text('user_ip'),
  user_agent: text('user_agent'),
  referrer: text('referrer'),
  session_id: text('session_id'),
  edition_id: integer('edition_id'),
  page_number: integer('page_number'),
  view_duration: integer('view_duration'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  user_id: text('user_id'),
});

export const active_sessions = pgTable('active_sessions', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').notNull().unique(),
  user_ip: text('user_ip'),
  current_page: text('current_page'),
  last_activity: text('last_activity').default('CURRENT_TIMESTAMP'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  user_id: text('user_id'),
});

export const daily_stats = pgTable('daily_stats', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(),
  total_views: integer('total_views').default(0),
  bounce_rate: integer('bounce_rate').default(0),
  avg_session_duration: integer('avg_session_duration').default(0),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  unique_visitors: integer('unique_visitors').default(0),
});

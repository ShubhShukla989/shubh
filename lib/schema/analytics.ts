import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const page_views = sqliteTable('page_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  page_url: text('page_url').notNull(),
  user_ip: text('user_ip'),
  user_agent: text('user_agent'),
  referrer: text('referrer'),
  session_id: text('session_id'),
  edition_id: integer('edition_id'),
  page_number: integer('page_number'),
  view_duration: integer('view_duration'), // seconds
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const active_sessions = sqliteTable('active_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: text('session_id').notNull().unique(),
  user_ip: text('user_ip'),
  current_page: text('current_page'),
  last_activity: text('last_activity').default('CURRENT_TIMESTAMP'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const daily_stats = sqliteTable('daily_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD format
  total_views: integer('total_views').default(0),
  unique_visitors: integer('unique_visitors').default(0),
  bounce_rate: integer('bounce_rate').default(0), // percentage
  avg_session_duration: integer('avg_session_duration').default(0), // seconds
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});
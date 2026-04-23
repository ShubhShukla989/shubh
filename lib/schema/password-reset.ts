import { pgTable, serial, integer, text, boolean } from 'drizzle-orm/pg-core';

export const passwordResetOtps = pgTable('password_reset_otps', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  expires_at: text('expires_at').notNull(),
  used: boolean('used').default(false),
  attempts: integer('attempts').default(0),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  used_at: text('used_at'),
});

export const otpAttempts = pgTable('otp_attempts', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  ip_address: text('ip_address'),
  attempts: integer('attempts').default(0),
  last_attempt: text('last_attempt').default('CURRENT_TIMESTAMP'),
  blocked_until: text('blocked_until'),
  user_agent: text('user_agent'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

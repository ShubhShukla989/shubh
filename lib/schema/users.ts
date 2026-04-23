import { pgTable, serial, integer, text, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullname: text('fullname').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('Admin'),
  mobile: text('mobile'),
  country_code: text('country_code'),
  address: text('address'),
  country: text('country'),
  state: text('state'),
  city: text('city'),
  zip: text('zip'),
  status: text('status').default('Active'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  role_id: integer('role_id').default(2),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const role_permissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role_id: integer('role_id').notNull(),
  permission_key: text('permission_key').notNull(),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const audit_logs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  action: text('action').notNull(),
  entity_type: text('entity_type'),
  entity_id: integer('entity_id'),
  details: text('details'),
  ip_address: text('ip_address'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Password Reset OTP System
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

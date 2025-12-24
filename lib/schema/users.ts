import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const role_permissions = sqliteTable('role_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull(),
  permission_key: text('permission_key').notNull(),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const audit_logs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id'),
  action: text('action').notNull(),
  entity_type: text('entity_type'),
  entity_id: integer('entity_id'),
  details: text('details'), // jsonb stored as text
  ip_address: text('ip_address'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
});

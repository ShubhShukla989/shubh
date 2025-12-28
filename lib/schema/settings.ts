import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type').default('text'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const site_settings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setting_key: text('setting_key').notNull().unique(),
  setting_value: text('setting_value'),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
  homepage_layout: text('homepage_layout'),
  site_header_layout: text('site_header_layout'),
  site_footer_layout: text('site_footer_layout'),
  homepage_type: text('homepage_type').default('normal'),
  default_category_id: integer('default_category_id'),
});

export const epaper_settings = sqliteTable('epaper_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entries_per_page: integer('entries_per_page').default(12),
  include_header_footer_map: integer('include_header_footer_map', { mode: 'boolean' }).default(false),
  include_header_footer_clip: integer('include_header_footer_clip', { mode: 'boolean' }).default(false),
  default_publishing_status: text('default_publishing_status').default('publish-immediately'),
  disable_right_click: integer('disable_right_click', { mode: 'boolean' }).default(false),
  keep_archive_days: integer('keep_archive_days').default(0),
  use_random_prefix: integer('use_random_prefix', { mode: 'boolean' }).default(false),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const area_map_watermark_settings = sqliteTable('area_map_watermark_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  enable_watermarking: integer('enable_watermarking', { mode: 'boolean' }).default(false),
  logo_url: text('logo_url'), // Single logo for all watermarking
  opacity: integer('opacity').default(100),
  mode: text('mode').default('in_outerside'),
  position: text('position').default('top_center'),
  min_width_px: integer('min_width_px').default(0),
  background_color: text('background_color').default('#ffffff'),
  foreground_color: text('foreground_color').default('#000000'),
  enable_border: integer('enable_border', { mode: 'boolean' }).default(false),
  border_width: integer('border_width').default(2),
  border_color: text('border_color').default('#000000'),
  info_text: text('info_text'),
  info_text_font: text('info_text_font').default('English'),
  enable_center_watermark: integer('enable_center_watermark', { mode: 'boolean' }).default(false),
  center_watermark_url: text('center_watermark_url'),
  center_watermark_opacity: integer('center_watermark_opacity').default(100),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const category_watermark_settings = sqliteTable('category_watermark_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category_id: integer('category_id').notNull().unique(),
  override_global_settings: integer('override_global_settings', { mode: 'boolean' }).default(false),
  enable_watermarking: integer('enable_watermarking', { mode: 'boolean' }).default(false),
  logo_url: text('logo_url'), // Single logo for all watermarking
  opacity: integer('opacity').default(100),
  mode: text('mode').default('in_outerside'),
  position: text('position').default('top_center'),
  min_width_px: integer('min_width_px').default(0),
  background_color: text('background_color').default('#ffffff'),
  foreground_color: text('foreground_color').default('#000000'),
  enable_border: integer('enable_border', { mode: 'boolean' }).default(false),
  border_width: integer('border_width').default(2),
  border_color: text('border_color').default('#000000'),
  info_text: text('info_text'),
  info_text_font: text('info_text_font').default('English'),
  enable_center_watermark: integer('enable_center_watermark', { mode: 'boolean' }).default(false),
  center_watermark_url: text('center_watermark_url'),
  center_watermark_opacity: integer('center_watermark_opacity').default(100),
  created_at: text('created_at').default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').default('CURRENT_TIMESTAMP'),
});

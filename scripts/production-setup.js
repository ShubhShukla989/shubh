#!/usr/bin/env node

/**
 * Production Database Setup Script
 * For VPS/Hostinger deployment
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🚀 Setting up production database...');

// Production database path (ensure writable directory)
const dbDir = path.join(process.cwd(), 'database');
const dbPath = path.join(dbDir, 'epapercms.db');

// Ensure database directory exists with proper permissions
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 });
  console.log('📁 Created database directory');
}

// Check if database already exists
if (fs.existsSync(dbPath)) {
  console.log('📦 Database already exists, skipping creation');
  process.exit(0);
}

try {
  // Create new database
  const db = new Database(dbPath);
  console.log('📦 Created production database');

  // Set proper file permissions
  fs.chmodSync(dbPath, 0o644);

  // Create tables
  const createTables = `
  -- Users table
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Categories table
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    alias TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Editions table
  CREATE TABLE editions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    alias TEXT,
    date TEXT NOT NULL,
    category_id INTEGER,
    pdf_url TEXT,
    description TEXT,
    status TEXT DEFAULT 'Draft',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_featured INTEGER DEFAULT 0,
    seo_h1 TEXT,
    seo_meta_description TEXT,
    scheduled_date TEXT
  );

  -- Edition Pages table
  CREATE TABLE edition_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    edition_id INTEGER,
    page_number INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    thumb_url TEXT,
    page_category_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    alias TEXT,
    description TEXT,
    category TEXT
  );

  -- Area Maps table
  CREATE TABLE area_maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    title TEXT,
    url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    linked_area_ids TEXT DEFAULT '{}',
    linked_page_number INTEGER,
    edition_id INTEGER
  );

  -- Settings table
  CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'string',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  `;

  db.exec(createTables);
  console.log('📋 Created database tables');

  // Insert production admin user
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);

  const insertData = `
  INSERT INTO users (name, email, password, role) VALUES 
  ('Admin User', 'admin@yourdomain.com', '${adminPassword}', 'admin');

  INSERT INTO categories (name, alias, description) VALUES 
  ('Daily News', 'daily-news', 'Daily newspaper editions');

  INSERT INTO settings (key, value, type) VALUES 
  ('site_title', 'E-Paper CMS', 'string'),
  ('site_description', 'Digital newspaper management system', 'string'),
  ('watermark_enabled', '1', 'boolean');
  `;

  db.exec(insertData);
  console.log('📝 Inserted production data');

  db.close();
  console.log('✅ Production database setup complete!');
  
} catch (error) {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
}
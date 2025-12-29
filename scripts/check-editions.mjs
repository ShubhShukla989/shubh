/**
 * Check Editions Script
 */

import Database from 'better-sqlite3';

// Database connection
const sqlite = new Database('./database/epapercms.db');

console.log('🔍 Checking existing editions...');

try {
  // Get all editions
  const editions = sqlite.prepare('SELECT * FROM editions').all();
  
  console.log(`📰 Found ${editions.length} editions`);
  
  for (const edition of editions) {
    console.log(`Edition ${edition.id}: ${edition.title} - PDF: ${edition.pdf_url}`);
  }
  
  // Get all pages
  const pages = sqlite.prepare('SELECT * FROM edition_pages').all();
  console.log(`📄 Found ${pages.length} pages total`);
  
  for (const page of pages) {
    console.log(`Page ${page.id}: Edition ${page.edition_id}, Page ${page.page_number} - Image: ${page.image_url}`);
  }
  
} catch (error) {
  console.error('❌ Error checking database:', error);
} finally {
  sqlite.close();
}
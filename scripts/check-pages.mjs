/**
 * Check Pages Script - Simple ES Module approach
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Database connection
const sqlite = new Database('./database/epapercms.db');

console.log('🔍 Checking existing pages...');

try {
  // Get all pages with image URLs
  const pages = sqlite.prepare('SELECT * FROM edition_pages WHERE image_url IS NOT NULL').all();
  
  console.log(`📄 Found ${pages.length} pages with image URLs`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const page of pages) {
    if (!page.image_url || page.image_url.startsWith('data:image')) {
      continue; // Skip base64 images
    }
    
    const originalPath = path.join(process.cwd(), 'public', page.image_url);
    let correctPath = null;
    let correctUrl = null;
    
    // Check if original path exists
    if (fs.existsSync(originalPath)) {
      console.log(`✅ Page ${page.id}: Path already correct - ${page.image_url}`);
      continue;
    }
    
    // Try to find the file in different locations
    const filename = path.basename(page.image_url);
    
    // Try direct uploads folder
    const directPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(directPath)) {
      correctPath = directPath;
      correctUrl = `/uploads/${filename}`;
    } else {
      // Try page-assets subfolder
      const pageAssetsPath = path.join(process.cwd(), 'public', 'uploads', 'page-assets', filename);
      if (fs.existsSync(pageAssetsPath)) {
        correctPath = pageAssetsPath;
        correctUrl = `/uploads/page-assets/${filename}`;
      }
    }
    
    if (correctUrl && correctUrl !== page.image_url) {
      // Update database with correct path
      const updateStmt = sqlite.prepare('UPDATE edition_pages SET image_url = ? WHERE id = ?');
      updateStmt.run(correctUrl, page.id);
      
      console.log(`🔧 Fixed page ${page.id}: ${page.image_url} → ${correctUrl}`);
      fixedCount++;
    } else if (!correctPath) {
      console.log(`❌ Page ${page.id}: File not found - ${filename}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixedCount} pages`);
  console.log(`❌ Missing files: ${errorCount} pages`);
  console.log(`🎉 Image path fix completed!`);
  
} catch (error) {
  console.error('❌ Error fixing image paths:', error);
} finally {
  sqlite.close();
}
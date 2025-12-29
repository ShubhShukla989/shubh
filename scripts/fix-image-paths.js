/**
 * Fix Image Paths Script
 * 
 * This script fixes existing database entries where image_url paths
 * don't match the actual file locations, preventing 404 errors.
 */

const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { edition_pages } = require('../lib/schema/index');
const { eq } = require('drizzle-orm');
const fs = require('fs');
const path = require('path');

// Database connection
const sqlite = new Database(process.env.DATABASE_URL.replace('file:', ''));
const db = drizzle(sqlite);

async function fixImagePaths() {
  console.log('🔧 Starting image path fix...');
  
  try {
    // Get all pages with image URLs
    const pages = await db
      .select()
      .from(edition_pages)
      .where(eq(edition_pages.image_url, edition_pages.image_url)); // Get all non-null

    console.log(`📄 Found ${pages.length} pages to check`);
    
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
        console.log(`✅ Page ${page.id}: Path already correct`);
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
        await db
          .update(edition_pages)
          .set({ image_url: correctUrl })
          .where(eq(edition_pages.id, page.id));
        
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
}

// Run the fix
fixImagePaths();
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  
  console.log('🖼️  Starting image optimization...\n');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 No uploads directory found, creating...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Find all image files
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];
  const imageFiles = [];
  
  function findImages(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findImages(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageFiles.push(filePath);
        }
      }
    });
  }
  
  findImages(publicDir);
  
  console.log(`📊 Found ${imageFiles.length} images to optimize\n`);
  
  if (imageFiles.length === 0) {
    console.log('✅ No images found to optimize');
    return;
  }
  
  let optimized = 0;
  let totalSavings = 0;
  
  for (const imagePath of imageFiles) {
    try {
      const relativePath = path.relative(publicDir, imagePath);
      const originalSize = fs.statSync(imagePath).size;
      
      // Skip if already optimized (has .optimized in name)
      if (imagePath.includes('.optimized')) {
        continue;
      }
      
      // Create optimized versions
      const dir = path.dirname(imagePath);
      const name = path.basename(imagePath, path.extname(imagePath));
      const ext = path.extname(imagePath);
      
      // Original format optimized
      const optimizedPath = path.join(dir, `${name}.optimized${ext}`);
      
      // WebP version
      const webpPath = path.join(dir, `${name}.webp`);
      
      // AVIF version (if supported)
      const avifPath = path.join(dir, `${name}.avif`);
      
      // Skip if optimized version already exists
      if (fs.existsSync(optimizedPath)) {
        console.log(`⏭️  Skipping ${relativePath} (already optimized)`);
        continue;
      }
      
      // Optimize original format
      await sharp(imagePath)
        .jpeg({ quality: 80, progressive: true })
        .png({ quality: 80, compressionLevel: 9 })
        .webp({ quality: 80 })
        .toFile(optimizedPath);
      
      // Create WebP version
      await sharp(imagePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      // Create AVIF version (smaller file size)
      try {
        await sharp(imagePath)
          .avif({ quality: 70 })
          .toFile(avifPath);
      } catch (error) {
        console.log(`⚠️  AVIF not supported for ${relativePath}`);
      }
      
      const optimizedSize = fs.existsSync(optimizedPath) ? fs.statSync(optimizedPath).size : originalSize;
      const savings = originalSize - optimizedSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
      
      console.log(`✅ ${relativePath}`);
      console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
      console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(1)} KB`);
      console.log(`   Savings: ${(savings / 1024).toFixed(1)} KB (${savingsPercent}%)`);
      
      // Show WebP size if created
      if (fs.existsSync(webpPath)) {
        const webpSize = fs.statSync(webpPath).size;
        console.log(`   WebP: ${(webpSize / 1024).toFixed(1)} KB`);
      }
      
      // Show AVIF size if created
      if (fs.existsSync(avifPath)) {
        const avifSize = fs.statSync(avifPath).size;
        console.log(`   AVIF: ${(avifSize / 1024).toFixed(1)} KB`);
      }
      
      console.log('');
      
      optimized++;
      totalSavings += savings;
      
    } catch (error) {
      console.error(`❌ Failed to optimize ${imagePath}:`, error.message);
    }
  }
  
  console.log(`🎉 Optimization complete!`);
  console.log(`📊 Summary:`);
  console.log(`   Images optimized: ${optimized}`);
  console.log(`   Total savings: ${(totalSavings / 1024 / 1024).toFixed(2)} MB`);
  if (optimized > 0) {
    console.log(`   Average savings per image: ${(totalSavings / optimized / 1024).toFixed(1)} KB`);
  }
}

if (require.main === module) {
  optimizeImages().catch(console.error);
}

module.exports = { optimizeImages };
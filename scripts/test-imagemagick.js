#!/usr/bin/env node

/**
 * Test ImageMagick Installation and Version Compatibility
 * 
 * This script tests:
 * - ImageMagick installation
 * - Version detection (v6 vs v7)
 * - Command compatibility (convert vs magick)
 * - PDF processing tools (pdftoppm, ghostscript)
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testImageMagick() {
  console.log('🔍 Testing ImageMagick Installation and Compatibility\n');
  
  const isUbuntu = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  
  console.log('🖥️  Platform:', process.platform);
  console.log('📋 Expected tools:');
  
  if (isUbuntu) {
    console.log('   - pdftoppm (from poppler-utils)');
    console.log('   - convert (ImageMagick v6)');
    console.log('   - identify (ImageMagick v6)');
  } else {
    console.log('   - gs/gswin64c (Ghostscript)');
    console.log('   - magick/convert (ImageMagick v6/v7)');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Test ImageMagick version and commands
  const commands = [
    { name: 'ImageMagick (convert)', cmd: 'convert -version' },
    { name: 'ImageMagick (magick)', cmd: 'magick -version' },
    { name: 'ImageMagick (identify)', cmd: 'identify -version' },
  ];
  
  if (isUbuntu) {
    commands.push(
      { name: 'pdftoppm', cmd: 'pdftoppm -h' },
      { name: 'Ghostscript', cmd: 'gs --version' }
    );
  } else {
    commands.push(
      { name: 'Ghostscript (gs)', cmd: 'gs --version' },
      { name: 'Ghostscript (gswin64c)', cmd: 'gswin64c --version' }
    );
  }
  
  for (const { name, cmd } of commands) {
    try {
      console.log(`\n🧪 Testing ${name}:`);
      const { stdout, stderr } = await execAsync(cmd);
      
      if (stdout) {
        const lines = stdout.split('\n').slice(0, 2);
        console.log('✅ FOUND:', lines.join(' ').trim());
        
        // Detect ImageMagick version
        if (name.includes('ImageMagick') && stdout.includes('ImageMagick')) {
          const version = stdout.match(/ImageMagick (\d+\.\d+)/)?.[1];
          if (version) {
            const majorVersion = parseInt(version.split('.')[0]);
            console.log(`   📌 Version: ${version} (v${majorVersion})`);
            
            if (majorVersion >= 7) {
              console.log('   💡 Use: magick, magick identify');
            } else {
              console.log('   💡 Use: convert, identify');
            }
          }
        }
      }
      
      if (stderr && !stderr.includes('Usage:') && !stderr.includes('help')) {
        console.log('⚠️  Warning:', stderr.split('\n')[0]);
      }
      
    } catch (error) {
      console.log('❌ NOT FOUND:', error.message.split('\n')[0]);
      
      // Provide installation instructions
      if (name.includes('pdftoppm') && isUbuntu) {
        console.log('   💡 Install: sudo apt install poppler-utils');
      } else if (name.includes('ImageMagick') && isUbuntu) {
        console.log('   💡 Install: sudo apt install imagemagick');
      } else if (name.includes('Ghostscript') && isUbuntu) {
        console.log('   💡 Install: sudo apt install ghostscript');
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🎯 Recommended Configuration:');
  
  if (isUbuntu) {
    console.log('Ubuntu VPS (Hostinger):');
    console.log('  PDF Extraction: pdftoppm (more reliable)');
    console.log('  Image Processing: convert (ImageMagick v6)');
    console.log('  Installation: sudo apt install poppler-utils imagemagick');
  } else if (isWindows) {
    console.log('Windows Development:');
    console.log('  PDF Extraction: Ghostscript');
    console.log('  Image Processing: magick (ImageMagick v7)');
  } else if (isMac) {
    console.log('macOS Development:');
    console.log('  PDF Extraction: Ghostscript');
    console.log('  Image Processing: convert/magick (depends on version)');
    console.log('  Installation: brew install imagemagick ghostscript poppler');
  }
  
  console.log('\n✨ Our code automatically detects platform and uses correct tools!');
}

// Run the test
testImageMagick().catch(console.error);
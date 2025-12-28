# ImageMagick v6 Compatibility for Ubuntu VPS

## 🎯 Problem Solved
Ubuntu VPS (Hostinger) uses ImageMagick v6 which has different command syntax than v7. Our code now automatically detects the platform and uses the correct commands.

## 🔧 Changes Made

### 1. PDF Extraction (`app/api/editions/[id]/extract-pages/route.ts`)
- **Ubuntu VPS**: Uses `pdftoppm` (more reliable than Ghostscript)
- **Windows/Mac**: Uses `Ghostscript` as before
- **Auto-detection**: Platform-specific tool selection

### 2. Image Optimization (`lib/image-optimization.ts`)
- **Ubuntu VPS**: Uses `convert` command (ImageMagick v6)
- **Windows/Mac**: Uses `magick` or `convert` based on version
- **Compatibility**: Works with both v6 and v7

### 3. Platform Detection
```javascript
const isUbuntu = process.platform === 'linux';
const isWindows = process.platform === 'win32';

// Ubuntu VPS: pdftoppm + convert
// Windows/Mac: Ghostscript + magick
```

## 📋 Ubuntu VPS Requirements

### Essential Tools:
```bash
sudo apt install poppler-utils -y    # pdftoppm for PDF extraction
sudo apt install imagemagick -y      # ImageMagick v6 (convert, identify)
sudo apt install ghostscript -y      # Optional fallback
```

### Command Differences:
| Platform | PDF Tool | Image Tool | Version |
|----------|----------|------------|---------|
| Ubuntu VPS | `pdftoppm` | `convert` | ImageMagick v6 |
| Windows | `gswin64c` | `magick` | ImageMagick v7 |
| macOS | `gs` | `convert`/`magick` | v6 or v7 |

## 🧪 Testing

### Test All Tools:
```bash
npm run test:imagemagick
```

This script tests:
- ImageMagick installation and version
- Command availability (convert vs magick)
- PDF processing tools (pdftoppm, ghostscript)
- Platform-specific recommendations

## ✅ Benefits

1. **Reliable PDF Extraction**: `pdftoppm` is more stable on Ubuntu than Ghostscript
2. **Cross-Platform**: Same code works on Ubuntu VPS, Windows, and macOS
3. **Auto-Detection**: No manual configuration needed
4. **Error Handling**: Clear error messages with installation instructions
5. **Performance**: Optimized for each platform's best tools

## 🚀 Deployment Ready

The code is now fully compatible with:
- **Hostinger Ubuntu VPS** (ImageMagick v6)
- **Windows Development** (ImageMagick v7)
- **macOS Development** (ImageMagick v6/v7)

No manual configuration required - the system automatically detects and uses the correct tools!
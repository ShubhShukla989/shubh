# 🚀 Production Deployment Guide - resume.publicvm.com

## 📋 Prerequisites

- Hostinger VPS with Ubuntu
- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy
- Domain: resume.publicvm.com

## 🛠️ Ubuntu VPS Setup (Required Tools)

### Install PDF Processing Tools:
```bash
# Essential for PDF extraction (Ubuntu VPS compatible)
sudo apt update
sudo apt install poppler-utils -y    # pdftoppm (better than Ghostscript on Ubuntu)
sudo apt install imagemagick -y      # ImageMagick v6 (uses 'convert' command)

# Verify installations
pdftoppm -h        # Should show help
convert -version   # Should show ImageMagick 6.x
identify -version  # Should show ImageMagick 6.x

# Optional: Ghostscript as fallback
sudo apt install ghostscript -y

# Test all tools with our script
npm run test:imagemagick
```

### Platform Detection:
- **Ubuntu VPS**: Uses `pdftoppm` + `convert` (ImageMagick v6)
- **Windows/Mac**: Uses `Ghostscript` + `magick` (ImageMagick v7)
- **Auto-detection**: Code automatically uses correct tools per platform

## 🔧 Quick Setup Commands for Port 3002

### 1. Clone & Install
```bash
git clone https://github.com/Adarsh261206/Epaper_Main.git epaper-resume
cd epaper-resume
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with production values:
# NEXTAUTH_URL=https://resume.publicvm.com
# PORT=3002
```

### 3. Database Setup
```bash
npm run setup:db
npm run setup:admin
```

### 4. Build & Start on Port 3002
```bash
npm run build:prod
PORT=3002 npm start
```

## 🌐 Production Environment Variables

Update `.env.local` for resume.publicvm.com:

```env
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=https://resume.publicvm.com
SITE_URL=https://resume.publicvm.com
NODE_ENV=production
PORT=3002
```

## 🔧 PM2 Configuration for Port 3002

Create `ecosystem.resume.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'epaper-resume',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      NEXTAUTH_URL: 'https://resume.publicvm.com'
    },
    node_args: '--max-old-space-size=2048',
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    log_file: './logs/resume-combined.log',
    out_file: './logs/resume-out.log',
    error_file: './logs/resume-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}
```

## 🌐 Nginx Configuration

Create `/etc/nginx/sites-available/resume.publicvm.com`:

```nginx
server {
    listen 80;
    server_name resume.publicvm.com www.resume.publicvm.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/resume.publicvm.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Performance Optimizations

- ✅ Extreme caching for 1000+ concurrent users
- ✅ Image optimization with 60-80% size reduction
- ✅ PDF optimization for millisecond loading
- ✅ Smart caching (no cache for admin, aggressive for users)
- ✅ Multi-site VPS optimizations
- ✅ Port 3002 configuration

## 🔒 Security Features

- ✅ Admin authentication
- ✅ Permission-based access control
- ✅ Secure file uploads
- ✅ XSS protection
- ✅ CSRF protection

## 📱 Features

- ✅ PDF to image extraction
- ✅ Image optimization
- ✅ Responsive design
- ✅ Admin panel
- ✅ Category management
- ✅ Edition management
- ✅ Page management

## 🆘 Troubleshooting

### PDF Extraction Issues (Ubuntu VPS)
```bash
# Check if tools are installed
pdftoppm -h                    # Should show help
convert -version               # Should show ImageMagick 6.x
identify -version              # Should show ImageMagick 6.x

# Install missing tools
sudo apt install poppler-utils -y    # For pdftoppm
sudo apt install imagemagick -y      # For convert/identify

# Test PDF extraction manually
pdftoppm -jpeg -r 200 test.pdf test-page

# If pdftoppm fails, install Ghostscript as fallback
sudo apt install ghostscript -y
```

### ImageMagick v6 vs v7 Issues:
```bash
# Ubuntu VPS (v6): Uses 'convert' command
convert input.jpg -quality 85 output.jpg

# Windows/Mac (v7): Uses 'magick' command  
magick input.jpg -quality 85 output.jpg

# Our code automatically detects and uses correct syntax
```

### Permission Issues
```bash
# Fix upload permissions
chmod 755 public/uploads
chown -R www-data:www-data public/uploads
```

### Port Issues
```bash
# Check if port 3002 is available
sudo netstat -tlnp | grep :3002

# Kill process on port 3002 if needed
sudo kill -9 $(sudo lsof -t -i:3002)
```

### Database Issues
```bash
# Reset database
rm database.db
npm run setup:db
npm run setup:admin
```

## 📞 Support

For issues, check the logs:
```bash
pm2 logs epaper-resume
```

## 🚀 Final Deployment Steps

```bash
# 1. Start the application
pm2 start ecosystem.resume.config.js

# 2. Save PM2 configuration
pm2 save
pm2 startup

# 3. Monitor performance
pm2 monit

# 4. Test the site
curl -I https://resume.publicvm.com
```
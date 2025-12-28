# 🚀 Production Deployment Guide - Hostinger VPS

## 📋 Prerequisites

- Hostinger VPS with Ubuntu
- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy

## 🔧 Quick Setup Commands

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd epaper-cms
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with your production values
```

### 3. Database Setup
```bash
npm run setup:db
npm run setup:admin
```

### 4. Build & Start
```bash
npm run build:prod
npm start
```

## 🌐 Production Environment Variables

Update `.env.local` with your production values:

```env
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com
NODE_ENV=production
```

## 📊 Performance Optimizations

- ✅ Extreme caching for 1000+ concurrent users
- ✅ Image optimization with 60-80% size reduction
- ✅ PDF optimization for millisecond loading
- ✅ Smart caching (no cache for admin, aggressive for users)
- ✅ Hostinger VPS optimizations included

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

### PDF Extraction Issues
```bash
# Install Ghostscript
sudo apt install ghostscript

# Install ImageMagick
sudo apt install imagemagick
```

### Permission Issues
```bash
# Fix upload permissions
chmod 755 public/uploads
chown -R www-data:www-data public/uploads
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
pm2 logs epaper-cms
```
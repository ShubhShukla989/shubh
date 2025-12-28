# 🚀 Multi-Website Hostinger VPS Setup - Port 3002

## 📋 Multiple Websites Configuration

### Current Setup:
- **adarshsharma.me** → Port 3000 (existing)
- **resume.publicvm.com** → Port 3002 (new)

## 🛠️ Ubuntu VPS Requirements

### Essential Tools Installation:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PDF processing tools (Ubuntu VPS compatible)
sudo apt install poppler-utils -y  # For pdftoppm (better than Ghostscript on Ubuntu)
sudo apt install imagemagick -y    # For image optimization (v6 - uses 'convert')

# Verify installations
pdftoppm -h        # Should show pdftoppm help
convert -version   # Should show ImageMagick v6.x
identify -version  # Should show ImageMagick v6.x

# Optional: Install Ghostscript as fallback
sudo apt install ghostscript -y

# Test all tools with our comprehensive script
npm run test:imagemagick
```

### ImageMagick v6 vs v7 Compatibility:
- **Ubuntu VPS**: Uses ImageMagick v6 (commands: `convert`, `identify`)
- **Windows/Mac**: May use ImageMagick v7 (commands: `magick`, `magick identify`)
- **Our Code**: Automatically detects platform and uses correct syntax

## 🌐 Nginx Configuration for Multiple Sites

### 1. Create New Site Config: `/etc/nginx/sites-available/resume.publicvm.com`

```nginx
server {
    listen 80;
    server_name resume.publicvm.com www.resume.publicvm.com;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        application/pdf;

    # Cache static files aggressively
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "STATIC";
    }
    
    # Cache PDF files for newspaper loading
    location /uploads/ {
        expires 1M;
        add_header Cache-Control "public, max-age=2592000";
        add_header X-Cache-Status "PDF";
        
        # Enable sendfile for better performance
        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
    }
    
    # Proxy to Next.js on PORT 3002
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
        
        # Enhanced buffer settings for 1000+ users
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 2. Enable the New Site

```bash
# Enable the new site
sudo ln -s /etc/nginx/sites-available/resume.publicvm.com /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 🔧 PM2 Configuration for Port 3002

### Create: `ecosystem.resume.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'epaper-resume',
    script: 'npm',
    args: 'start',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,  // Different port
      NEXTAUTH_URL: 'https://resume.publicvm.com'
    },
    // Performance optimizations for 1000+ users
    node_args: '--max-old-space-size=2048',
    max_memory_restart: '1G',
    
    // Auto restart settings
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging
    log_file: './logs/resume-combined.log',
    out_file: './logs/resume-out.log',
    error_file: './logs/resume-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}
```

## 🚀 Deployment Commands for New Site

```bash
# 1. Clone the new code
git clone https://github.com/Adarsh261206/Epaper_Main.git epaper-resume
cd epaper-resume

# 2. Install dependencies
npm install

# 3. Setup environment for new domain
cp .env.local.example .env.local
# Edit .env.local:
# NEXTAUTH_URL=https://resume.publicvm.com
# PORT=3002

# 4. Setup database
npm run setup:db
npm run setup:admin

# 5. Build for production (Hostinger-specific)
npm run build:hostinger  # Skips database calls during build

# 6. Start with PM2 on port 3002
pm2 start ecosystem.resume.config.js

# 7. Save PM2 configuration
pm2 save
pm2 startup
```

## 📊 Multi-Site Performance Monitoring

```bash
# Monitor both sites
pm2 monit

# Check specific app
pm2 logs epaper-resume

# Restart specific app
pm2 restart epaper-resume

# Check nginx status
sudo systemctl status nginx
```

## 🎯 Expected Performance (Per Site)

### For 1000+ Concurrent Users Each:
- **PDF Load Time**: < 100ms (cached), < 800ms (first load)
- **Page Load Time**: < 200ms (cached), < 600ms (first load)
- **API Response**: < 50ms (cached), < 300ms (fresh)
- **Memory Usage**: < 1GB per site with cluster mode
- **Total CPU Usage**: < 80% for both sites combined

## 🔒 SSL Setup (Optional)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate for new domain
sudo certbot --nginx -d resume.publicvm.com -d www.resume.publicvm.com
```

## 📈 Performance Testing Both Sites

```bash
# Test original site
ab -n 1000 -c 100 https://adarshsharma.me/

# Test new site
ab -n 1000 -c 100 https://resume.publicvm.com/

# Test PDF loading on new site
ab -n 500 -c 50 https://resume.publicvm.com/uploads/editions/edition-1.pdf
```

## 🚨 Resource Management

### System Resources for Both Sites:
- **RAM**: Minimum 4GB recommended for both sites
- **CPU**: 2+ cores recommended
- **Storage**: SSD recommended for database performance
- **Bandwidth**: Monitor usage for 1000+ users per site

### Emergency Scaling:
1. **Upgrade VPS**: More RAM/CPU cores
2. **Add CDN**: Cloudflare for both domains
3. **Database optimization**: Separate databases if needed
4. **Load balancer**: Multiple VPS instances
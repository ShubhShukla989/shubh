# Hostinger VPS Optimization for 1000+ Concurrent Users

## 🚀 Server Configuration (Hostinger VPS)

### 1. Nginx Configuration (`/etc/nginx/sites-available/your-domain`)

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
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

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "STATIC";
    }
    
    # Cache PDF files aggressively
    location /uploads/ {
        expires 1M;
        add_header Cache-Control "public, max-age=2592000";
        add_header X-Cache-Status "PDF";
        
        # Enable sendfile for better performance
        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
    }
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Buffer settings for better performance
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

### 2. PM2 Configuration (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'epaper-cms',
    script: 'npm',
    args: 'start',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Performance optimizations
    node_args: '--max-old-space-size=2048',
    max_memory_restart: '1G',
    
    // Auto restart on high CPU/memory
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}
```

### 3. System Optimizations

```bash
# Increase file limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize TCP settings
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
echo "net.core.netdev_max_backlog = 5000" >> /etc/sysctl.conf

# Apply changes
sysctl -p
```

## 📊 Performance Monitoring

### 4. Install monitoring tools

```bash
# Install htop for system monitoring
sudo apt install htop

# Install iotop for disk I/O monitoring
sudo apt install iotop

# Monitor Node.js processes
pm2 monit
```

## 🎯 Expected Performance Results

### For 1000+ Concurrent Users:
- **PDF Load Time**: < 100ms (cached), < 800ms (first load)
- **Page Load Time**: < 200ms (cached), < 600ms (first load)
- **API Response**: < 50ms (cached), < 300ms (fresh)
- **Memory Usage**: < 1GB with cluster mode
- **CPU Usage**: < 70% with proper caching

### Cache Hit Ratios:
- **PDFs**: 95%+ hit ratio after first load
- **API calls**: 90%+ hit ratio
- **Static assets**: 98%+ hit ratio
- **Pages**: 85%+ hit ratio

## 🔧 Deployment Commands

```bash
# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor performance
pm2 monit
```

## 🚨 Emergency Scaling

If you hit limits, consider:

1. **Upgrade VPS**: More RAM/CPU cores
2. **Add CDN**: Cloudflare for global caching
3. **Database optimization**: Add read replicas
4. **Load balancer**: Multiple VPS instances
5. **Redis caching**: External cache layer

## 📈 Performance Testing

```bash
# Test concurrent users
ab -n 1000 -c 100 http://your-domain.com/

# Test PDF loading
ab -n 500 -c 50 http://your-domain.com/uploads/editions/edition-1.pdf
```
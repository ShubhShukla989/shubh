module.exports = {
  apps: [{
    name: 'epaper-resume',
    script: 'npm',
    args: 'start',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,  // Port 3002 for resume.publicvm.com
      NEXTAUTH_URL: 'https://resume.publicvm.com',
      SITE_URL: 'https://resume.publicvm.com'
    },
    // Performance optimizations for 1000+ users
    node_args: '--max-old-space-size=2048',
    max_memory_restart: '1G',
    
    // Auto restart settings
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging for resume site
    log_file: './logs/resume-combined.log',
    out_file: './logs/resume-out.log',
    error_file: './logs/resume-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // Environment-specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002,
      NEXTAUTH_URL: 'https://resume.publicvm.com',
      SITE_URL: 'https://resume.publicvm.com'
    }
  }]
}